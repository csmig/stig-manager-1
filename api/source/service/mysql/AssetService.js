'use strict';
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')
const J2X = require("fast-xml-parser").j2xParser
const he = require('he');

let _this = this

/**
Generalized queries for asset(s).
**/
exports.queryAssets = async function (inProjection = [], inPredicates = {}, elevate = false, userObject) {
  let connection
  try {
    const context = userObject.privileges.globalAccess || elevate ? dbUtils.CONTEXT_ALL : dbUtils.CONTEXT_USER

    const columns = [
      'CAST(a.assetId as char) as assetId',
      'a.name',
      `json_object (
        'collectionId', CAST(p.collectionId as char),
        'name', p.name,
        'workflow', p.workflow
      ) as "collection"`,
      'a.ip',
      'a.nonnetwork',
      'a.metadata'
    ]
    let joins = [
      'asset a',
      'left join collection p on a.collectionId = p.collectionId',
      'left join collection_grant pg on p.collectionId = pg.collectionId',
      'left join stig_asset_map sa on a.assetId = sa.assetId',
      'left join current_rev cr on sa.benchmarkId = cr.benchmarkId',
      'left join user_stig_asset_map usa on sa.saId = usa.saId'
    ]

    // PROJECTIONS
    if (inProjection.includes('adminStats')) {
      columns.push(`json_object(
        'stigCount', COUNT(distinct sa.saId),
        'stigAssignedCount', COUNT(distinct usa.saId),
        'ruleCount', (SELECT SUM(ruleCount) FROM current_rev where benchmarkId in (select distinct benchmarkId from stig_asset_map where assetId = a.assetId))
        ) as "adminStats"`)
    }
    if (inProjection.includes('stigGrants')) {
      // A bit more complex than the Oracle query because we can't use nested json_arrayagg's
      columns.push(`(select
        CASE WHEN COUNT(byStig.stigAssetUsers) > 0 THEN json_arrayagg(byStig.stigAssetUsers) ELSE json_array() END
      from
        (select
          json_object('benchmarkId', r.benchmarkId, 'users',
          -- empty array on null handling 
          case when count(r.users) > 0 then json_arrayagg(r.users) else json_array() end ) as stigAssetUsers
        from
        (select
          sa.benchmarkId,
          -- if no user, return null instead of object with null property values
          case when ud.userId is not null then
            json_object(
              'userId', CAST(ud.userId as char), 
              'username', ud.username
            ) 
          else NULL end as users
          FROM 
            stig_asset_map sa
            left join user_stig_asset_map usa on sa.saId = usa.saId
            left join user_data ud on usa.userId = ud.userId
          WHERE
          sa.assetId = a.assetId) as r
        group by r.benchmarkId) as byStig) as "stigGrants"`)
    }
    if ( inProjection.includes('reviewers')) {
      // This projection is only available for endpoint /stigs/{benchmarkId}/assets
      // Subquery relies on predicate :benchmarkId being set
      columns.push(`(select
          case when count(u.userId > 0) then json_arrayagg(
          -- if no user, return null instead of object with null property values
          case when u.userId is not null then json_object('userId', CAST(u.userId as char), 'username', u.username) else NULL end) 
          else json_array() end as reviewers
        FROM 
          stig_asset_map sa
          left join user_stig_asset_map usa on sa.saId = usa.saId
          left join user u on usa.userId = u.userId
        WHERE
          sa.assetId = a.assetId and sa.benchmarkId = :benchmarkId) as "reviewers"`)
    }
    if (inProjection.includes('stigs')) {
      //TODO: If benchmarkId is a predicate in main query, this incorrectly only shows that STIG
      // joins.push('left join current_rev cr on sa.benchmarkId=cr.benchmarkId')
      joins.push('left join stig st on cr.benchmarkId=st.benchmarkId')
      columns.push(`cast(
        concat('[', 
          coalesce (
            group_concat(distinct 
              case when cr.benchmarkId is not null then 
                json_object(
                  'benchmarkId', cr.benchmarkId, 
                  'lastRevisionStr', concat('V', cr.version, 'R', cr.release), 
                  'lastRevisionDate', cr.benchmarkDateSql,
                  'title', st.title,
                  'ruleCount', cr.ruleCount)
              else null end 
        order by cr.benchmarkId),
            ''),
        ']')
      as json) as "stigs"`)
    }

    // PREDICATES
    let predicates = {
      statements: [],
      binds: {}
    }
    if (inPredicates.assetId) {
      predicates.statements.push('a.assetId = :assetId')
      predicates.binds.assetId = inPredicates.assetId
    }
    if (inPredicates.collectionId) {
      predicates.statements.push('a.collectionId = :collectionId')
      predicates.binds.collectionId = inPredicates.collectionId
    }
    if (inPredicates.benchmarkId) {
      predicates.statements.push('sa.benchmarkId = :benchmarkId')
      predicates.binds.benchmarkId = inPredicates.benchmarkId
    }
    if (context == dbUtils.CONTEXT_USER) {
      predicates.statements.push('pg.userId = :userId')
      predicates.statements.push('CASE WHEN pg.accessLevel = 1 THEN usa.userId = pg.userId ELSE TRUE END')
      predicates.binds.userId = userObject.userId
    }

    // CONSTRUCT MAIN QUERY
    let sql = 'SELECT '
    sql+= columns.join(",\n")
    sql += ' FROM '
    sql+= joins.join(" \n")
    if (predicates.statements.length > 0) {
      sql += "\nWHERE " + predicates.statements.join(" and ")
    }
    sql += ' group by a.assetId, a.name, a.collectionId, a.ip, a.nonnetwork, p.collectionId, p.name'
    sql += ' order by a.name'
  
    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    let [rows] = await connection.query(sql, predicates.binds)
    return (rows)
  }
  catch (err) {
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.queryAssetStigs = async function (inPredicates = {}, elevate = false, userObject) {
  let connection
  try {
    const context = userObject.privileges.globalAccess || elevate ? dbUtils.CONTEXT_ALL : dbUtils.CONTEXT_USER
    const columns = [
      'distinct cr.benchmarkId', 
      `concat('V', cr.version, 'R', cr.release) as lastRevisionStr`, 
      'cr.benchmarkDateSql as lastRevisionDate',
      'st.title'
    ]
    let joins = [
      'asset a',
      'left join collection p on a.collectionId = p.collectionId',
      'left join collection_grant pg on p.collectionId = pg.collectionId',
      'left join stig_asset_map sa on a.assetId = sa.assetId',
      'left join user_stig_asset_map usa on sa.saId = usa.saId',
      'inner join current_rev cr on sa.benchmarkId=cr.benchmarkId',
      'left join stig st on cr.benchmarkId=st.benchmarkId'
    ]
    // PREDICATES
    let predicates = {
      statements: [],
      binds: []
    }
    if (inPredicates.assetId) {
      predicates.statements.push('a.assetId = ?')
      predicates.binds.push( inPredicates.assetId )
    }
    if (inPredicates.benchmarkId) {
      predicates.statements.push('cr.benchmarkId = ?')
      predicates.binds.push( inPredicates.benchmarkId )
    }
    if (context == dbUtils.CONTEXT_USER) {
      predicates.statements.push('pg.userId = ?')
      predicates.statements.push('CASE WHEN pg.accessLevel = 1 THEN usa.userId = pg.userId ELSE TRUE END')
      predicates.binds.push( userObject.userId )
    }
    // CONSTRUCT MAIN QUERY
    let sql = 'SELECT '
    sql+= columns.join(",\n")
    sql += ' FROM '
    sql+= joins.join(" \n")
    if (predicates.statements.length > 0) {
      sql += "\nWHERE " + predicates.statements.join(" and ")
    }
    sql += ' order by cr.benchmarkId'
  
    connection = await dbUtils.pool.getConnection()
    let [rows] = await connection.query(sql, predicates.binds)
    return (rows)
  }
  catch (err) {
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}


exports.queryAssetStigGrants = async function (inPredicates = {}, elevate = false, userObject) {
  let connection
  try {
    const context = userObject.privileges.globalAccess || elevate ? 'CONTEXT_ALL' : 'CONTEXT_USER'
    const columns = [
      'ud.userId',
      'ud.username'
    ]
    let joins = [
      'asset a',
      'inner join collection p on a.collectionId = p.collectionId',
      'inner join collection_grant pg on p.collectionId = pg.collectionId',
      'inner join stig_asset_map sa on a.assetId = sa.assetId',
      'inner join user_stig_asset_map usa on sa.saId = usa.saId',
      'inner join user_data ud on usa.userId = ud.userId',
    ]
    // PREDICATES
    let predicates = {
      statements: [],
      binds: []
    }
    if (inPredicates.assetId) {
      predicates.statements.push('a.assetId = ?')
      predicates.binds.push( inPredicates.assetId )
    }
    if (inPredicates.benchmarkId) {
      predicates.statements.push('sa.benchmarkId = ?')
      predicates.binds.push( inPredicates.benchmarkId )
    }
    if (inPredicates.userId) {
      predicates.statements.push('usa.userId = ?')
      predicates.binds.push( inPredicates.userId )
    }
    if (context === 'CONTEXT_USER') {
      predicates.statements.push('pg.userId = ?')
      predicates.statements.push('CASE WHEN pg.accessLevel = 1 THEN usa.userId = pg.userId ELSE TRUE END')
      predicates.binds.push( userObject.userId )
    }
    // CONSTRUCT MAIN QUERY
    let sql = 'SELECT '
    sql+= columns.join(",\n")
    sql += ' FROM '
    sql+= joins.join(" \n")
    if (predicates.statements.length > 0) {
      sql += "\nWHERE " + predicates.statements.join(" and ")
    }
    sql += ' order by ud.userId'
  
    connection = await dbUtils.pool.getConnection()
    let [rows] = await connection.query(sql, predicates.binds)
    return (rows)
  }
  catch (err) {
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.addOrUpdateAsset = async function (writeAction, assetId, body, projection, elevate, userObject) {
  let connection
  try {
    // CREATE: assetId will be null
    // REPLACE/UPDATE: assetId is not null

    // Extract or initialize non-scalar properties to separate variables
    let binds
    let { stigs, ...assetFields } = body

    // Convert boolean scalar values to database values (true=1 or false=0)
    if (assetFields.hasOwnProperty('nonnetwork')) {
      assetFields.nonnetwork = assetFields.nonnetwork ? 1 : 0
    }
    if (assetFields.hasOwnProperty('metadata')) {
      assetFields.metadata = JSON.stringify(assetFields.metadata)
    }

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    await connection.query('START TRANSACTION')

    // Process scalar properties
    binds = { ...assetFields}

    if (writeAction === dbUtils.WRITE_ACTION.CREATE) {
    // INSERT into assets
    let sqlInsert =
      `INSERT INTO
          asset
          (name, ip, collectionId, nonnetwork, metadata)
        VALUES
          (:name, :ip, :collectionId, :nonnetwork, :metadata)`
      let [rows] = await connection.query(sqlInsert, binds)
      assetId = rows.insertId
    }
    else if (writeAction === dbUtils.WRITE_ACTION.UPDATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      if (Object.keys(binds).length > 0) {
        // UPDATE into assets
        let sqlUpdate =
          `UPDATE
              asset
            SET
              ?
            WHERE
              assetId = ?`
        await connection.query(sqlUpdate, [assetFields, assetId])
      }
    }
    else {
      throw('Invalid writeAction')
    }

    // Process stigs, spec requires for CREATE/REPLACE not for UPDATE
    if (stigs) {
      if (writeAction !== dbUtils.WRITE_ACTION.CREATE) {
        let sqlDeleteBenchmarks = `
          DELETE FROM 
            stig_asset_map
          WHERE 
            assetId = ?`
        if (stigs.length > 0) {
          sqlDeleteBenchmarks += ` and benchmarkId NOT IN ?`
        }
        // DELETE from stig_asset_map, which will cascade into user_stig_aset_map
        await connection.query(sqlDeleteBenchmarks, [ assetId, [stigs] ])
      }
      if (stigs.length > 0) {
        // Map bind values
        let stigAssetMapBinds = stigs.map( benchmarkId => [benchmarkId, assetId])
        // INSERT into stig_asset_map
        let sqlInsertBenchmarks = `
          INSERT IGNORE INTO 
            stigman.stig_asset_map (benchmarkId, assetId)
          VALUES
            ?`
        await connection.query(sqlInsertBenchmarks, [stigAssetMapBinds])
      }
    }
    // Commit the changes
    await connection.commit()
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }

  // Fetch the new or updated Asset for the response
  try {
    let row = await _this.getAsset(assetId, projection, elevate, userObject)
    return row
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }  
}

exports.queryChecklist = async function (inProjection, inPredicates, elevate, userObject) {

  //TODO: remove select distinct ruleId from rule_oval_map -- bad execution plan
  let connection
  try {
    let context
    if (userObject.accessLevel === 3 || elevate) {
      context = dbUtils.CONTEXT_ALL
    } else if (userObject.accessLevel === 2) {
      context = dbUtils.CONTEXT_DEPT
    } else {
      context = dbUtils.CONTEXT_USER
    }

    let columns = [
      'CAST(:assetId as char) as "assetId"',
      'r.ruleId',
      'r.title as "ruleTitle"',
      'g.groupId',
      'g.title as "groupTitle"',
      'r.severity',
      `cast(COUNT(scap.ruleId) > 0 as json) as "autoCheckAvailable"`,
      `result.api as "result"`,
      `cast(review.autoResult is true as json) as "autoResult"`,
      `status.api as "status"`,
      `cast(CASE
        WHEN review.ruleId is null
        THEN 0
        ELSE
          CASE WHEN review.resultId != 4
          THEN
            CASE WHEN review.resultComment != ' ' and review.resultComment is not null
              THEN 1
              ELSE 0 END
          ELSE
            CASE WHEN review.actionId is not null and review.actionComment is not null and review.actionComment != ' '
              THEN 1
              ELSE 0 END
          END
      END is true as json) as "reviewComplete"`
    ]
    let joins = [
      'current_rev rev',
      'left join rev_group_map rg on rev.revId = rg.revId',
      'left join `group` g on rg.groupId=g.groupId',
      'left join rev_group_rule_map rgr on rg.rgId=rgr.rgId',
      'left join rule r on rgr.ruleId=r.ruleId',
      // 'left join severity_cat_map sc on r.severity=sc.severity',
      'left join review on r.ruleId = review.ruleId and review.assetId = :assetId',
      'left join result on review.resultId=result.resultId',
      'left join status on review.statusId=status.statusId',
      'left join rule_oval_map scap on r.ruleId=scap.ruleId'
    ]
    // PREDICATES
    let predicates = {
      statements: [],
      binds: {}
    }
    if (inPredicates.assetId) {
      predicates.binds.assetId = inPredicates.assetId
    }
    if (inPredicates.benchmarkId) {
      predicates.statements.push('rev.benchmarkId = :benchmarkId')
      predicates.binds.benchmarkId = inPredicates.benchmarkId
    }
    if (inPredicates.revisionStr !== 'latest') {
      joins.splice(0, 1, 'revision rev')
      let results = /V(\d+)R(\d+(\.\d+)?)/.exec(inPredicates.revisionStr)
      let revId =  `${inPredicates.benchmarkId}-${results[1]}-${results[2]}`
      predicates.statements.push('rev.revId = :revId')
      predicates.binds.revId = revId
    }
    // CONSTRUCT MAIN QUERY
    let sql = 'SELECT '
    sql+= columns.join(",\n")
    sql += ' FROM '
    sql+= joins.join(" \n")
    if (predicates.statements.length > 0) {
      sql += "\nWHERE " + predicates.statements.join(" and ")
    }
    sql += `\ngroup by
      r.ruleId,
      r.title,
      g.groupId,
      g.title,
      r.severity,
      result.api ,
      review.autoResult ,
      status.api,
      review.ruleId,
      review.resultId,
      review.actionId,
      review.resultComment,
      review.actionComment
    `
    sql += `\norder by substring(g.groupId from 3) + 0`
  
    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    let formatted = connection.format(sql, predicates.binds)

    // let [rows] = await connection.query(sql, predicates.binds)
    let [rows] = await connection.query( sql, predicates.binds )
    return (rows)
  }
  catch (err) {
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.queryStigAssets = async function (inProjection = [], inPredicates = {}, elevate = false, userObject) {
  let connection
  try {
    const context = userObject.privileges.globalAccess || elevate ? dbUtils.CONTEXT_ALL : dbUtils.CONTEXT_USER
    const columns = [
      'DISTINCT CAST(a.assetId as char) as assetId',
      'a.name',
      `json_object(
        'collectionId', c.collectionId,
        'name', c.name,
        'workflow', c.workflow) as collection`
    ]
    let joins = [
      'collection c',
      'left join collection_grant cg on c.collectionId = cg.collectionId',
      'inner join asset a on c.collectionId = a.collectionId',
      'left join stig_asset_map sa on a.assetId = sa.assetId',
      'left join user_stig_asset_map usa on sa.saId = usa.saId',
    ]
    // PREDICATES
    let predicates = {
      statements: [],
      binds: []
    }
    if (inPredicates.collectionId) {
      predicates.statements.push('c.collectionId = ?')
      predicates.binds.push( inPredicates.collectionId )
    }
    if (inPredicates.benchmarkId) {
      predicates.statements.push('sa.benchmarkId = ?')
      predicates.binds.push( inPredicates.benchmarkId )
    }
    if (context == dbUtils.CONTEXT_USER) {
      predicates.statements.push('cg.userId = ?')
      predicates.statements.push('CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END')
      predicates.binds.push( userObject.userId )
    }
    // CONSTRUCT MAIN QUERY
    let sql = 'SELECT '
    sql+= columns.join(",\n")
    sql += ' FROM '
    sql+= joins.join(" \n")
    if (predicates.statements.length > 0) {
      sql += "\nWHERE " + predicates.statements.join(" and ")
    }
    sql += ' order by a.name'
  
    connection = await dbUtils.pool.getConnection()
    let [rows] = await connection.query(sql, predicates.binds)
    return (rows)
  }
  catch (err) {
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}


exports.cklFromAssetStig = async function cklFromAssetStig (assetId, benchmarkId, revisionStr, elevate, userObject) {
  let connection
  try {
    let cklJs = {
      CHECKLIST: {
        ASSET: {
          ROLE: 'None',
          ASSET_TYPE: 'Computing',
          HOST_NAME: null,
          HOST_IP: null,
          HOST_MAC: null,
          HOST_GUID: null,
          HOST_FQDN: null,
          TECH_AREA: null,
          TARGET_KEY: '2777',
          WEB_OR_DATABASE: 'false',
          WEB_DB_SITE: null,
          WEB_DB_INSTANCE: null
        },
        STIGS: {
          iSTIG: {
            STIG_INFO:
              {
                SI_DATA: []
              },
            VULN: []
          }
        }
      }
    }
    let sqlGetBenchmarkId
    if (revisionStr === 'latest') {
      sqlGetBenchmarkId = `select
        cr.benchmarkId, 
        s.title, 
        cr.revId, 
        cr.description, 
        cr.version, 
        cr.release, 
        cr.benchmarkDate
      from
        current_rev cr 
        left join stig s on cr.benchmarkId = s.benchmarkId
      where
        cr.benchmarkId = ?`
    }
    else {
      sqlGetBenchmarkId = `select
        r.benchmarkId,
        s.title,
        r.description,
        r.version,
        r.release,
        r.benchmarkDate
      from 
        stig s 
        left join revision r on s.benchmarkId=r.benchmarkId
      where
        r.revId = ?`  
    }

    let sqlGetAsset = "select name, ip from asset where assetId = ?"
    let sqlGetChecklist =`SELECT 
      g.groupId,
      r.severity,
      g.title as "groupTitle",
      r.ruleId,
      r.title as "ruleTitle",
      r.weight,
      r.version,
      r.vulnDiscussion,
      r.iaControls,
      r.falsePositives,
      r.falseNegatives,
      r.documentable,
      r.mitigations,
      r.potentialImpacts,
      r.thirdPartyTools,
      r.mitigationControl,
      r.responsibility,
      r.severityOverrideGuidance,
      result.ckl as "result",
      review.resultComment,
      action.en as "action",
      review.actionComment,
      MAX(c.content) as "checkContent",
      MAX(fix.text) as "fixText",
      group_concat(rgrcc.cci ORDER BY rgrcc.cci) as "ccis"
    FROM
      revision rev 
      left join rev_group_map rg on rev.revId = rg.revId 
      left join \`group\` g on rg.groupId = g.groupId 

      left join rev_group_rule_map rgr on rg.rgId = rgr.rgId 
      left join rule r on rgr.ruleId = r.ruleId 
      left join severity_cat_map sc on r.severity = sc.severity 
      
      left join rule_cci_map rcc on rgr.ruleId = rcc.ruleId 

      left join rev_group_rule_check_map rgrc on rgr.rgrId = rgrc.rgrId
      left join \`check\` c on rgrc.checkId = c.checkId

      left join rev_group_rule_fix_map rgrf on rgr.rgrId = rgrf.rgrId
      left join fix on rgrf.fixId = fix.fixId

      left join review on r.ruleId = review.ruleId and review.assetId = ?
      left join result on review.resultId = result.resultId 
      left join status on review.statusId = status.statusId 
      left join action on review.actionId = action.actionId                                     

    WHERE
      rev.revId = ?
    GROUP BY
      g.groupId,
      r.severity,
      g.title,
      r.ruleId,
      r.title,
      r.weight,
      r.version,
      r.vulnDiscussion,
      r.iaControls,
      r.falsePositives,
      r.falseNegatives,
      r.documentable,
      r.mitigations,
      r.potentialImpacts,
      r.thirdPartyTools,
      r.mitigationControl,
      r.responsibility,
      r.severityOverrideGuidance,
      result.ckl,
      review.resultComment,
      action.en,
      review.actionComment
    order by
      substring(g.groupId from 3) + 0 asc
    `
    connection = await dbUtils.pool.getConnection()

    // ASSET
    let [resultGetAsset] = await connection.query(sqlGetAsset, [assetId])
    cklJs.CHECKLIST.ASSET.HOST_NAME = resultGetAsset[0].name
    cklJs.CHECKLIST.ASSET.HOST_IP = resultGetAsset[0].ip

    // CHECKLIST.STIGS.iSTIG.STIG_INFO.SI_DATA
    // Calculate revId
    let resultGetBenchmarkId, revId
    if (revisionStr === 'latest') {
      ;[resultGetBenchmarkId] = await connection.query(sqlGetBenchmarkId, [benchmarkId])
      revId = resultGetBenchmarkId[0].revId
    }
    else {
      let results = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
      revId =  `${benchmarkId}-${results[1]}-${results[2]}`
      ;[resultGetBenchmarkId] = await connection.execute(sqlGetBenchmarkId, [revId])
    }

    let stig = resultGetBenchmarkId[0]
    let siDataRefs = [
      { SID_NAME: 'version', SID_DATA: stig.version },
      { SID_NAME: 'classification' },
      { SID_NAME: 'customname' },
      { SID_NAME: 'stigid', SID_DATA: stig.benchmarkId },
      { SID_NAME: 'description', SID_DATA: stig.description },
      { SID_NAME: 'filename', SID_DATA: 'stig-manager-oss' },
      { SID_NAME: 'releaseinfo', SID_DATA: `Release: ${stig.release} Benchmark Date: ${stig.benchmarkDate}`},
      { SID_NAME: 'title', SID_DATA: stig.title },
      { SID_NAME: 'uuid', SID_DATA: '391aad33-3cc3-4d9a-b5f7-0d7538b7b5a2' },
      { SID_NAME: 'notice', SID_DATA: 'terms-of-use' },
      { SID_NAME: 'source', }
    ]
    let siDataArray = cklJs.CHECKLIST.STIGS.iSTIG.STIG_INFO.SI_DATA
    siDataRefs.forEach(siDatum => {
      siDataArray.push(siDatum)
    })

    // CHECKLIST.STIGS.iSTIG.STIG_INFO.VULN
    let [resultGetChecklist] = await connection.query(sqlGetChecklist, [assetId, revId])

    let stigDataRef = [
      ['Vuln_Num', 'groupId' ],
      ['Severity',  'severity' ],
      ['Group_Title',  'groupTitle' ],
      ['Rule_ID',  'ruleId' ],
      ['Rule_Ver',  'version' ],
      ['Rule_Title',  'ruleTitle' ],
      ['Vuln_Discuss',  'vulnDiscussion' ],
      ['IA_Controls',  'iaControls' ],
      ['Check_Content',  'checkContent' ],
      ['Fix_Text',  'fixText' ],
      ['False_Positives',  'falsePositives' ],
      ['False_Negatives',  'falseNegatives' ],
      ['Documentable', 'documentable' ],
      ['Mitigations', 'mitigations' ],
      ['Potential_Impact', 'potentialImpacts' ],
      ['Third_Party_Tools', 'thirdPartyTools' ],
      ['Mitigation_Control', 'mitigationControl' ],
      ['Responsibility', 'responsibility' ],
      ['Security_Override_Guidance', 'severityOverrideGuidance' ] 
      // STIGViewer bug requires using Security_Override_Guidance instead of Severity_Override_Guidance
    ]

    let vulnArray = cklJs.CHECKLIST.STIGS.iSTIG.VULN
    resultGetChecklist.forEach( r => {
      let vulnObj = {
        STIG_DATA: [],
        STATUS: r.result || 'Not_Reviewed',
        FINDING_DETAILS: r.resultComment,
        COMMENTS: r.action ? `${r.action}: ${r.actionComment}` : null,
        SEVERITY_OVERRIDE: null,
        SEVERITY_JUSTIFICATION: null
      }
      stigDataRef.forEach(stigDatum => {
        vulnObj.STIG_DATA.push({
          VULN_ATTRIBUTE: stigDatum[0],
          ATTRIBUTE_DATA: r[stigDatum[1]]
        })
      })
      // CCI_REFs
      if (r.ccis) {
        let ccis = r.ccis.split(',')
        ccis.forEach( cci=> {
          vulnObj.STIG_DATA.push({
            VULN_ATTRIBUTE: 'CCI_REF',
            ATTRIBUTE_DATA: `CCI-${cci}`
          })
        })
        vulnArray.push(vulnObj)
      }
    })

    let defaultOptions = {
      attributeNamePrefix : "@_",
      attrNodeName: "@", //default is false
      textNodeName : "#text",
      ignoreAttributes : true,
      cdataTagName: "__cdata", //default is false
      cdataPositionChar: "\\c",
      format: true,
      indentBy: "  ",
      supressEmptyNode: false,
      tagValueProcessor: a => {
        return a ? he.encode(a.toString(), { useNamedReferences: false}) : a 
      },// default is a=>a
      attrValueProcessor: a=> he.encode(a, {isAttributeValue: isAttribute, useNamedReferences: true})// default is a=>a
  };
  
    const j2x = new J2X(defaultOptions)
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<!--STIG Manager :: 3.0-->\n'
    xml += j2x.parse(cklJs)
    return (xml)

  }
  catch (e) {
    throw (e)
  }
  finally {
    if (typeof connection !== 'undefinied') {
      await connection.release()
    }
  }
}

/**
 * Create an Asset
 *
 * body Asset  (optional)
 * returns Asset
 **/
exports.createAsset = async function(body, projection, elevate, userObject) {
  try {
    let row = await _this.addOrUpdateAsset(dbUtils.WRITE_ACTION.CREATE, null, body, projection, elevate, userObject)
    return (row)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Delete an Asset
 *
 * assetId Integer A path parameter that indentifies an Asset
 * returns Asset
 **/
exports.deleteAsset = async function(assetId, projection, elevate, userObject) {
  try {
    let rows = await _this.queryAssets(projection, {assetId: assetId}, elevate, userObject)
    let sqlDelete = `DELETE FROM asset where assetId = ?`
    await dbUtils.pool.query(sqlDelete, [assetId])
    return (rows[0])
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.deleteAssetStig = async function (assetId, benchmarkId, elevate, userObject ) {
  try {
    let rows = await _this.queryAssetStigs( {
      assetId: assetId,
      benchmarkId: benchmarkId
    }, elevate, userObject)
    let sqlDelete = `DELETE FROM stig_asset_map where assetId = ? and benchmarkId = ?`
    await dbUtils.pool.query(sqlDelete, [assetId, benchmarkId])
    return (rows[0])
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.deleteAssetStigs = async function (assetId, elevate, userObject ) {
  try {
    let rows = await _this.queryAssetStigs( {assetId: assetId}, elevate, userObject)
    let sqlDelete = `DELETE FROM stig_asset_map where assetId = ?`
    await dbUtils.pool.query(sqlDelete, [assetId])
    return (rows)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.deleteAssetStigGrant = async function (assetId, benchmarkId, userId, elevate, userObject ) {
  try {
    // TODO
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

/**
 * Return an Asset
 *
 * assetId Integer A path parameter that indentifies an Asset
 * returns AssetDetail
 **/
exports.getAsset = async function(assetId, projection, elevate, userObject) {
  try {
    let rows = await _this.queryAssets(projection, {
      assetId: assetId
    }, elevate, userObject)
  return (rows[0])
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of Assets accessible to the user
 *
 * collectionId Integer Selects Assets mapped to a Collection (optional)
 * benchmarkId String Selects Assets mapped to a STIG (optional)
 * dept String Selects Assets exactly matching a department string (optional)
 * returns List
 **/
exports.getAssets = async function(collectionId, benchmarkId, projection, elevate, userObject) {
  try {
    let rows = await _this.queryAssets(projection, {
      collectionId: collectionId,
      benchmarkId: benchmarkId
    }, elevate, userObject)
    return (rows)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.getAssetStigs = async function (assetId, elevate, userObject ) {
  try {
    let rows = await _this.queryAssetStigs({
      assetId: assetId
    }, elevate, userObject)
    return (rows)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }

}

exports.getAssetStigGrants = async function (assetId, benchmarkId, elevate, userObject ) {
  try {
    let rows = await _this.queryAssetStigGrants({
      assetId: assetId,
      benchmarkId: benchmarkId
    }, elevate, userObject)
    return (rows)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.getChecklistByAssetStig = async function(assetId, benchmarkId, revisionStr, format, elevate, userObject) {
  try {
    switch (format) {
      case 'json':
        let rows = await _this.queryChecklist(null, {
          assetId: assetId,
          benchmarkId: benchmarkId,
          revisionStr: revisionStr
        }, elevate, userObject)
        return (rows)
      case 'ckl':
        let xml = await _this.cklFromAssetStig(assetId,benchmarkId, revisionStr, elevate, userObject)
        return (xml)
    }
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.getStigAssetsByBenchmarkId = async function( collectionId, benchmarkId, projection, elevate, userObject) {
  try {
    let rows = await _this.queryStigAssets(projection, {
      collectionId: collectionId,
      benchmarkId: benchmarkId
    }, elevate, userObject)
    return (rows)

  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


exports.setStigAssetsByBenchmarkId = async function(collectionId, benchmarkId, assetIds, projection, elevate, userObject) {
  let connection
  try {
    connection = await dbUtils.pool.getConnection()
    await connection.query('START TRANSACTION')

    let sqlDeleteBenchmarks = `
    DELETE FROM 
      stig_asset_map
    WHERE 
      benchmarkId = ?`
    if (assetIds.length > 0) {
      sqlDeleteBenchmarks += ' and assetId NOT IN ?'
    }  
    // DELETE from stig_asset_map, which will cascade into user_stig_aset_map
    await connection.query( sqlDeleteBenchmarks, [ benchmarkId, [assetIds] ] )
    
    // Push any bind values
    let binds = []
    assetIds.forEach( assetId => {
      binds.push([benchmarkId, assetId])
    })
    if (binds.length > 0) {
      // INSERT into stig_asset_map
      let sqlInsertBenchmarks = `
      INSERT IGNORE INTO 
        stig_asset_map (benchmarkId, assetId)
      VALUES
        ?`
      await connection.query(sqlInsertBenchmarks, [ binds ])
    }
    // Commit the changes
    await connection.commit()
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}
/**
 * Merge updates to an Asset
 *
 * body Asset  (optional)
 * projection
 * assetId Integer A path parameter that indentifies an Asset
 * returns AssetDetail
 **/
exports.updateAsset = async function( assetId, body, projection, elevate, userObject ) {
  try {
    let row = await _this.addOrUpdateAsset(dbUtils.WRITE_ACTION.UPDATE, assetId, body, projection, elevate, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

/**
 * Replace an Asset
 *
 * body Asset
 * projection
 * assetId Integer A path parameter that indentifies an Asset
 * returns AssetDetail
 **/
exports.replaceAsset = async function( assetId, body, projection, elevate, userObject ) {
  try {
    let row = await _this.addOrUpdateAsset(dbUtils.WRITE_ACTION.REPLACE, assetId, body, projection, elevate, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}