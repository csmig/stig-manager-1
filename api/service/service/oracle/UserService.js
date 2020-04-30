'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')


/**
Generalized queries for users
**/
exports.queryUsers = async function (inProjection, inPredicates, elevate, userObject) {
  let context
  if (userObject.role == 'Staff' || elevate) {
    context = dbUtils.CONTEXT_ALL
  } else if (userObject.role == "IAO") {
    context = dbUtils.CONTEXT_DEPT
  } else {
    context = dbUtils.CONTEXT_USER
  }

  let columns = [
    'ud.id as "userId"',
    'ud.cn as "username"',
    'ud.name as "display"',
    'ud.dept as "dept"',
    'ud.roleId as "role"',
    'ud.canAdmin as "canAdmin"'
  ]
  let joins = [
    'stigman.user_data ud',
  ]

  // PROJECTIONS
  if (inProjection && inProjection.includes('stigReviews')) {
    columns.push(`(select
      json_arrayagg( distinct 
          json_object(
              KEY 'benchmarkId' VALUE sa.stigId,
              KEY 'asset' VALUE json_object(
                KEY 'assetId' VALUE a.assetid,
                KEY 'name' VALUE a.name
                ABSENT ON NULL
              )
          )
         order by sa.stigId, a.name returning varchar2(32000)
      )
    FROM 
        stigman.stig_asset_map sa
        left join stigman.assets a on sa.assetId = a.assetId
        left join stigman.user_stig_asset_map usa on sa.saId = usa.saId
    where usa.userId = ud.id
    group by usa.userId) as "stigReviews"`)
  }

  // PREDICATES
  let predicates = {
    statements: [],
    binds: {}
  }
  if (inPredicates.userId) {
    predicates.statements.push('ud.id = :userId')
    predicates.binds.userId = inPredicates.userId
  }
  if (inPredicates.role) {
    predicates.statements.push('ud.roleId = :roleId')
    predicates.binds.roleId = dbUtils.USER_ROLE[inPredicates.role].id
  }
  if (inPredicates.dept) {
    predicates.statements.push('ud.dept = :dept')
    predicates.binds.dept = inPredicates.deptId
  }
  if (inPredicates.canAdmin) {
    predicates.statements.push('ud.canAdmin = :canAdmin')
    predicates.binds.canAdmin = inPredicates.canAdmin ? 1 : 0
  }
  if (context == dbUtils.CONTEXT_DEPT) {
    predicates.statements.push('ud.dept = :dept')
    predicates.binds.dept = userObject.dept
  } 

  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += ' FROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  sql += ' order by ud.cn'
  
  try {
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)
    await connection.close()

    // Post-process each row, unfortunately.
    // * Oracle doesn't have a BOOLEAN data type, so we must cast columns 'nonnetwork' and 'scanexempt'
    // * Oracle doesn't support a JSON type, so we parse string values from 'packages' and 'stigs' into objects
    for (let x = 0, l = result.rows.length; x < l; x++) {
      let record = result.rows[x]
      // Handle booleans
      record.canAdmin = record.canAdmin == 1 ? true : false
      // Convert roleId
      record.role = dbUtils.USER_ROLE_ID[record.role].role
      if ('stigReviews' in record) {
       // Check for "empty" arrays 
        record.stigReviews = record.stigReviews ? JSON.parse(record.stigReviews) : []
      }
    }
    return (result.rows)
  }
  catch (err) {
    throw err
  }
}

exports.addOrUpdateUser = async function (writeAction, userId, body, projection, elevate, userObject) {
  let connection // available to try, catch, and finally blocks
  try {
    // CREATE: userId will be null
    // REPLACE/UPDATE: assetId is not null

    // Extract or initialize non-scalar properties to separate variables
    let { stigReviews, ...userFields } = body
    stigReviews = stigReviews ? stigReviews : []

    // Convert boolean scalar values to database values (true=1 or false=0)
    if ('canAdmin' in userFields) {
      userFields.canAdmin = userFields.canAdmin ? 1 : 0
    }
    // Convert role to roleId
    if ('role' in userFields) {
      userFields.roleId = dbUtils.USER_ROLE[userFields.role].id
      delete userFields.role
    }
    if ('username' in userFields) {
      userFields.cn = userFields.username
      delete userFields.username
    }
    if ('display' in userFields) {
      userFields.name = userFields.display
      delete userFields.display
    }

    // Connect to Oracle
    let options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    connection = await oracledb.getConnection()

    // Process scalar properties
    let binds = {...userFields}
    if (writeAction === dbUtils.WRITE_ACTION.CREATE) {
      // INSERT into user_data
      let sqlInsert =
        `INSERT INTO
            stigman.user_data
            (cn, name, dept, roleId, canAdmin)
          VALUES
            (:cn, :name, :dept, :roleId, :canAdmin)
          RETURNING
            id into :userId`
      binds = {...userFields}
      binds.userId = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER}
      let result = await connection.execute(sqlInsert, binds, options)
      userId = result.outBinds.userId[0]
    }
    else if (writeAction === dbUtils.WRITE_ACTION.UPDATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      if (Object.keys(binds).length > 0) {        // UPDATE into assets
        let sqlUpdate =
          `UPDATE
              stigman.user_data
            SET
              ${dbUtils.objectBindObject(userFields, binds)}
            WHERE
              id = :userId`
        binds.userId = userId
        await connection.execute(sqlUpdate, binds, options)
      }
    }
    else {
      throw('Invalid writeAction')
    }

    // Process stigReviews if present
    if (writeAction === dbUtils.WRITE_ACTION.REPLACE || 
        writeAction === dbUtils.WRITE_ACTION.CREATE ||
        stigReviews.length == 0 ) {
      // DELETE from user_stig_asset_map
      let sqlDeleteStigAssets = 'DELETE FROM stigman.user_stig_asset_map where userId = :userId'
      await connection.execute(sqlDeleteStigAssets, [userId])
    }
    if (stigReviews.length > 0) {
      let sqlInsertStigAssets = `
        INSERT /*+ ignore_row_on_dupkey_index(user_stig_asset_map(userId, saId)) */ INTO 
          stigman.user_stig_asset_map (userId,saId)
        VALUES (:userId, (SELECT saId from stigman.stig_asset_map WHERE stigId=:benchmarkId and assetId=:assetId))`      
      let binds = stigReviews.map(i => [userId, i.benchmarkId, i.assetId])
      // INSERT into asset_package_map
      await connection.executeMany(sqlInsertStigAssets, binds)
    }
    // Commit the changes
    await connection.commit()
  }
  catch (err) {
    await connection.rollback()
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.close()
    }
  }

  // Fetch the new or updated User for the response
  try {
    let row = await this.getUserByUserId(userId, projection, elevate, userObject)
    return row
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }  
}


/**
 * Create a User
 *
 * body UserAssign 
 * projection List Additional properties to include in the response.  (optional)
 * returns List
 **/
exports.createUser = async function(body, projection, elevate, userObject) {
  try {
    let row = await this.addOrUpdateUser(dbUtils.WRITE_ACTION.CREATE, null, body, projection, elevate, userObject)
    return (row)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Create a User
 *
 * body UserAssign 
 * projection List Additional properties to include in the response.  (optional)
 * returns UserProjected
 **/
exports.deleteUser = async function(userId, projection, elevate, userObject) {
  try {
    let rows = await this.queryUsers(projection, {userId: userId}, elevate, userObject)
    let sqlDelete = `DELETE FROM stigman.user_data where id = :userId`
    let connection = await oracledb.getConnection()
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    }
    await connection.execute(sqlDelete, [userId], options)
    await connection.close()
    return (rows[0])
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a User
 *
 * userId Integer Selects a User
 * projection List Additional properties to include in the response.  (optional)
 * returns UserProjected
 **/
exports.getUserByUserId = async function(userId, projection, elevate, userObject) {
  try {
    let rows = await this.queryUsers( projection, {
      userId: userId
    }, elevate, userObject)
    return (rows[0])
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of Users accessible to the requester
 *
 * projection List Additional properties to include in the response.  (optional)
 * elevate Boolean Elevate the user context for this request if user is permitted (canAdmin) (optional)
 * role UserRole  (optional)
 * dept String Selects Users exactly matching a department string (optional)
 * canAdmin Boolean Selects Users matching the condition (optional)
 * returns List of UserProjected
 **/
exports.getUsers = async function(role, dept, canAdmin, projection, elevate, userObject) {
  try {
    let rows = await this.queryUsers( projection, {
      role: role,
      dept: dept,
      canAdmin: canAdmin
    }, elevate, userObject)
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.replaceUser = async function( userId, body, projection, elevate, userObject ) {
  try {
    let row = await this.addOrUpdateUser(dbUtils.WRITE_ACTION.REPLACE, userId, body, projection, elevate, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.updateUser = async function( userId, body, projection, elevate, userObject ) {
  try {
    let row = await this.addOrUpdateUser(dbUtils.WRITE_ACTION.UPDATE, userId, body, projection, elevate, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

