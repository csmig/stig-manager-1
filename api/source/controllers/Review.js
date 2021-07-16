'use strict';

const writer = require('../utils/writer.js')
const Parsers = require('../utils/parsers.js')
const config = require('../utils/config')
const Review = require(`../service/${config.database.type}/ReviewService`)

module.exports.postReviewsByAsset = async function postReviewsByAsset (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let reviewsRequested = req.swagger.params['body'].value

    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      //Check each reviewed rule against grants and stig assignments
      const userRules = await Review.getRulesByAssetUser( assetId, req.userObject )
      const permitted = [], rejected = []
      let errors
      for (const review of reviewsRequested) {
        if (userRules.has(review.ruleId)) {
          permitted.push(review)
        }
        else {
          rejected.push(review)
        }
      }
      if (permitted.length > 0) {
         errors = await Review.putReviewsByAsset(assetId, permitted, req.userObject)
      }
      writer.writeJson(res, {
        permitted,
        rejected,
        errors
      })
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.deleteReviewByAssetRule = async function deleteReviewByAssetRule (req, res, next) {
try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let ruleId = req.swagger.params['ruleId'].value
    let projection = req.swagger.params['projection'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.deleteReviewByAssetRule(assetId, ruleId, projection, req.userObject)
        writer.writeJson(res, response)
      }
      else {
        throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to delete the review of this rule."} ) )
      }
      }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.exportReviews = async function exportReviews (projection, userObject) {
  try {
    return await Review.getReviews(projection, {}, userObject )
  }
  catch (err) {
    throw (err)
  }
} 

module.exports.getReviewByAssetRule = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let ruleId = req.swagger.params['ruleId'].value
    let projection = req.swagger.params['projection'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      let response = await Review.getReviews( projection, {
        collectionId: collectionId,
        assetId: assetId,
        ruleId: ruleId
      }, req.userObject)
      writer.writeJson(res, response[0])
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getReviewsByCollection = async function getReviewsByCollection (req, res, next) {
  try {
    let projection = req.swagger.params['projection'].value
    let collectionId = req.swagger.params['collectionId'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      let response = await Review.getReviews( projection, {
        collectionId: collectionId,
        result: req.swagger.params['result'].value,
        action: req.swagger.params['action'].value,
        status: req.swagger.params['status'].value,
        rules: req.swagger.params['rules'].value || 'current-mapped',
        ruleId: req.swagger.params['ruleId'].value,
        groupId: req.swagger.params['groupId'].value,
        cci: req.swagger.params['cci'].value,
        userId: req.swagger.params['userId'].value,
        assetId: req.swagger.params['assetId'].value,
        benchmarkId: req.swagger.params['benchmarkId'].value,
        metadata: req.swagger.params['metadata'].value
      }, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getReviewsByAsset = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let projection = req.swagger.params['projection'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      let response = await Review.getReviews( projection, {
        collectionId: collectionId,
        assetId: assetId,
        rules: req.swagger.params['rules'].value || 'current-mapped',
        result: req.swagger.params['result'].value,
        action: req.swagger.params['action'].value,
        status: req.swagger.params['status'].value,
        benchmarkId: req.swagger.params['benchmarkId'].value,
        metadata: req.swagger.params['metadata'].value
      }, req.userObject )
      writer.writeJson(res, response)
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.putReviewByAssetRule = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let ruleId = req.swagger.params['ruleId'].value
    let body = req.swagger.params['body'].value
    let projection = req.swagger.params['projection'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.putReviewByAssetRule( projection, assetId, ruleId, body, req.userObject)
        if (response.status === 'created') {
          writer.writeJson(res, response.row, 201)
        } else {
          writer.writeJson(res, response.row )
        }
      }
      else {
        throw ( writer.respondWithCode ( 403, {message: "User has insufficient privilege to put a review of this rule."} ) )
      }
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }  
}

module.exports.patchReviewByAssetRule = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let ruleId = req.swagger.params['ruleId'].value
    let body = req.swagger.params['body'].value
    let projection = req.swagger.params['projection'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.patchReviewByAssetRule( projection, assetId, ruleId, body, req.userObject)
        writer.writeJson(res, response )
      }
      else {
        throw ( writer.respondWithCode ( 403, {message: "User has insufficient privilege to patch the review of this rule."} ) )
      }
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }  
}

module.exports.getReviewMetadata = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let ruleId = req.swagger.params['ruleId'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.getReviewMetadata( assetId, ruleId, req.userObject)
        writer.writeJson(res, response )
      }
      else {
        throw ( writer.respondWithCode ( 403, {message: "User has insufficient privilege to patch the review of this rule."} ) )
      }
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }  
}

module.exports.patchReviewMetadata = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let ruleId = req.swagger.params['ruleId'].value
    let metadata = req.swagger.params['body'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        await Review.patchReviewMetadata( assetId, ruleId, metadata)
        let response = await Review.getReviewMetadata( assetId, ruleId)
        writer.writeJson(res, response )
      }
      else {
        throw ( writer.respondWithCode ( 403, {message: "User has insufficient privilege to patch the review of this rule."} ) )
      }
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }  
}

module.exports.putReviewMetadata = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let ruleId = req.swagger.params['ruleId'].value
    let body = req.swagger.params['body'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        await Review.putReviewMetadata( assetId, ruleId, body)
        let response = await Review.getReviewMetadata( assetId, ruleId)
        writer.writeJson(res, response )
      }
      else {
        throw ( writer.respondWithCode ( 403, {message: "User has insufficient privilege to patch the review of this rule."} ) )
      }
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }  
}

module.exports.getReviewMetadataKeys = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let ruleId = req.swagger.params['ruleId'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.getReviewMetadataKeys( assetId, ruleId, req.userObject)
        if (!response)  throw ( writer.respondWithCode ( 404, { message: `metadata keys not found`} ) )
        writer.writeJson(res, response )
      }
      else {
        throw ( writer.respondWithCode ( 403, {message: "User has insufficient privilege to patch the review of this rule."} ) )
      }
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }  
}

module.exports.getReviewMetadataValue = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let ruleId = req.swagger.params['ruleId'].value
    let key = req.swagger.params['key'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.getReviewMetadataValue( assetId, ruleId, key, req.userObject)
        if (!response)  throw ( writer.respondWithCode ( 404, { message: `metadata key not found`} ) )
        writer.writeJson(res, response )
      }
      else {
        throw ( writer.respondWithCode ( 403, {message: "User has insufficient privilege to patch the review of this rule."} ) )
      }
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }  
}

module.exports.putReviewMetadataValue = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let ruleId = req.swagger.params['ruleId'].value
    let key = req.swagger.params['key'].value
    let value = req.swagger.params['body'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.putReviewMetadataValue( assetId, ruleId, key, value)
        writer.writeJson(res, response )
      }
      else {
        throw ( writer.respondWithCode ( 403, {message: "User has insufficient privilege to patch the review of this rule."} ) )
      }
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }  
}


module.exports.deleteReviewMetadataKey = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let ruleId = req.swagger.params['ruleId'].value
    let key = req.swagger.params['key'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.deleteReviewMetadataKey( assetId, ruleId, key, req.userObject)
        writer.writeJson(res, response )
      }
      else {
        throw ( writer.respondWithCode ( 403, {message: "User has insufficient privilege to patch the review of this rule."} ) )
      }
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }  
}

