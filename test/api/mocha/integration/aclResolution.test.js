
const chai = require("chai")
const chaiHttp = require("chai-http")
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
chai.use(chaiHttp)
chai.use(deepEqualInAnyOrder)
const expect = chai.expect
const config = require("../testConfig.json")
const utils = require("../utils/testUtils.js")
const reference = require("../referenceData.js")

const admin = {
  name: "admin",
  grant: "Owner",
  token:
    "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44",
}

const lvl1 = {
    name: "lvl1",
    userId: "85",
    token:
      "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDg5ODQsImlhdCI6MTY3MDU2ODE4NCwiYXV0aF90aW1lIjoxNjcwNTY4MTg0LCJqdGkiOiIxMDhmMDc2MC0wYmY5LTRkZjEtYjE0My05NjgzNmJmYmMzNjMiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJlM2FlMjdiOC1kYTIwLTRjNDItOWRmOC02MDg5ZjcwZjc2M2IiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjE0ZmE5ZDdkLTBmZTAtNDQyNi04ZmQ5LTY5ZDc0YTZmMzQ2NCIsInNlc3Npb25fc3RhdGUiOiJiNGEzYWNmMS05ZGM3LTQ1ZTEtOThmOC1kMzUzNjJhZWM0YzciLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6ImI0YTNhY2YxLTlkYzctNDVlMS05OGY4LWQzNTM2MmFlYzRjNyIsIm5hbWUiOiJyZXN0cmljdGVkIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibHZsMSIsImdpdmVuX25hbWUiOiJyZXN0cmljdGVkIn0.OqLARi5ILt3j2rMikXy0ECTTqjWco0-CrMwzE88gUv2i8rVO9kMgVsXbtPk2L2c9NNNujnxqg7QIr2_sqA51saTrZHvzXcsT8lBruf74OubRMwcTQqJap-COmrzb60S7512k0WfKTYlHsoCn_uAzOb9sp8Trjr0NksU8OXCElDU"
}

describe("Multiple Group ACL Collisions", () => {

  before(async function () {
      await utils.loadAppData()
  })

  let userGroup1
  let userGroup2

  it("Remove Base appdata userGroup grant from test Colleciton", async () => {

    const res = await chai.request(config.baseUrl)  
      .delete(`/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.testGroup.testCollectionGrantId}`)
      .set('Authorization', `Bearer ${admin.token}`)
    expect(res).to.have.status(200)
  })
  
  it('should create a test user group with lvl1 user in it.', async () => {
      const res = await chai
          .request(config.baseUrl)
          .post(`/user-groups?elevate=true&projection=collections`)
          .set('Authorization', 'Bearer ' + config.adminToken)
          .send({
              "name": "ACLCollisionGroup1",
              "description": "test group",
              "userIds": [
              lvl1.userId   
              ]
          })
          userGroup1 = res.body
          expect(res).to.have.status(201)
          expect(res.body.collections).to.be.empty
  })

  it('should another test user group with lvl1 user in it.', async () => {

      const res = await chai
          .request(config.baseUrl)
          .post(`/user-groups?elevate=true&projection=collections`)
          .set('Authorization', 'Bearer ' + config.adminToken)
          .send({
          "name": "ACLCollisionGroup2",
          "description": "test group",
          "userIds": [
              lvl1.userId   
          ]
      })
      userGroup2 = res.body
      expect(res).to.have.status(201)
      expect(res.body.collections).to.be.empty
      
  })

  it("should assign both groups created to the test collection with restricted grant", async function () {

      const res = await chai.request(config.baseUrl)
        .post(`/collections/${reference.testCollection.collectionId}/grants`)
        .set('Authorization', `Bearer ${config.adminToken}`)
        .send([{
            userGroupId: userGroup1.userGroupId,
            accessLevel: 1
        }])
      expect(res).to.have.status(200)
      expect(res.body.accessLevel).to.equal(1)
      userGroup1.grantId = res.body.grantId

      const res2 = await chai.request(config.baseUrl)
          .post(`/collections/${reference.testCollection.collectionId}/grants`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{
            userGroupId: userGroup2.userGroupId,
              accessLevel: 1
          }])
      expect(res2).to.have.status(200)
      expect(res2.body.accessLevel).to.equal(1)
      userGroup2.grantId = res2.body.grantId
  })

  /*
  Do not run at this level, run at describe above
  */
  describe("Group 1: r, Group 2: rw on Asset", () => {

      it(`should set group1 acl to r on test asset`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/${userGroup1.grantId}/acl`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"assetId":reference.testAsset.assetId,"access":"r"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
          expect(res.body.acl[0].asset.assetId).to.equal(reference.testAsset.assetId)

      })

      it(`should set group2 acl to rw on test asset`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/${userGroup2.grantId}/acl`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"assetId":reference.testAsset.assetId,"access":"rw"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("rw")
          expect(res.body.acl[0].asset.assetId).to.equal(reference.testAsset.assetId)
      })

      it("should confirm group1 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/${userGroup1.grantId}/acl`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
      })

      it("should confirm group2 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/${userGroup2.grantId}/acl`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("rw")
      })

      it('should return all resources with access of "r" from ACLCollisionGroup1', async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)

          for(const acl of res.body){
              expect(acl.access).to.be.equal("r")
              expect(acl.asset.assetId).to.be.equal(reference.testAsset.assetId)
              expect(acl.aclSources.length).to.be.equal(1)
              expect(acl.aclSources[0].aclRule.access).to.be.equal("r")
              expect(acl.aclSources[0].grantee.name).to.be.equal("ACLCollisionGroup1")
              expect(acl.aclSources[0].grantee.accessLevel).to.be.equal(1)
          }
      })
  })

  describe("Group 1: r, Group 2: none on Asset", () => {

      it(`should set group1 acl to r on test asset`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/${userGroup1.grantId}/acl`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"assetId":reference.testAsset.assetId,"access":"r"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
          expect(res.body.acl[0].asset.assetId).to.equal(reference.testAsset.assetId)

      })

      it(`should set group2 acl to none on test asset`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/${userGroup2.grantId}/acl`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"assetId":reference.testAsset.assetId,"access":"none"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("none")
          expect(res.body.acl[0].asset.assetId).to.equal(reference.testAsset.assetId)
      })

      it("should confirm group1 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/${userGroup1.grantId}/acl`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
      })

      it("should confirm group2 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/${userGroup2.grantId}/acl`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("none")
      })

      it('should return empty array because user as "none"', async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)

          expect(res.body).to.be.empty
      })
  })

  describe("Group 1: rw, Group 2: r on Test Label", () => {

      it(`should set group1 acl to rw on test label`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/${userGroup1.grantId}/acl`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"labelId":reference.testCollection.fullLabel,"access":"rw"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("rw")
          expect(res.body.acl[0].label.labelId).to.equal(reference.testCollection.fullLabel)

      })

      it(`should set group2 acl to r on test label`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/${userGroup2.grantId}/acl`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"labelId":reference.testCollection.fullLabel,"access":"r"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
          expect(res.body.acl[0].label.labelId).to.equal(reference.testCollection.fullLabel)
      })

      it("should confirm group1 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/${userGroup1.grantId}/acl`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("rw")
      })

      it("should confirm group2 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/${userGroup2.grantId}/acl`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
      })

      it('should return read only assets from group 2s read ACL', async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          for(const acl of res.body){
              expect(acl.access).to.be.equal("r")
              expect(acl.asset.assetId).to.be.oneOf(["42","62"])
              expect(acl.aclSources.length).to.be.equal(1)
              expect(acl.aclSources[0].aclRule.access).to.be.equal("r")
              expect(acl.aclSources[0].grantee.name).to.be.equal("ACLCollisionGroup2")
              expect(acl.aclSources[0].grantee.accessLevel).to.be.equal(1)
          }
      })
  })

  describe("Advanced ACL collision", () => {

      it(`should set group1 acl to rw on test label`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/${userGroup1.grantId}/acl`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"labelId":reference.testCollection.fullLabel, "benchmarkId":reference.testCollection.benchmark, "access":"rw"}, {"assetId":"154","access":"r"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(2)
          for(const acl of res.body.acl){
              if(acl.label){
                  expect(acl.access).to.equal("rw")
              }
              else {
                  expect(acl.access).to.equal("r")
              }
          }
      })

      it(`should set group2 acl to r on test label`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/${userGroup2.grantId}/acl`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"labelId":reference.testCollection.fullLabel,"access":"r"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
          expect(res.body.acl[0].label.labelId).to.equal(reference.testCollection.fullLabel)
      })

      it("should confirm group1 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/${userGroup1.grantId}/acl`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(2)
          for(const acl of res.body.acl){
              if(acl.label){
                  expect(acl.access).to.equal("rw")
              }
              else {
                  expect(acl.access).to.equal("r")
              }
          }
      })

      it("should confirm group2 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/${userGroup2.grantId}/acl`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
      })

      it('should return effective ACLs belonging from a combination of both groups', async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          for(const acl of res.body){
              if(acl.asset.assetId === "154"){
                  expect(acl.access).to.be.equal("r")
                  expect(acl.aclSources[0].grantee.name).to.be.equal("ACLCollisionGroup1")
              }
              else if(acl.asset.assetId === "42" || acl.asset.assetId === "62"){
                 if(acl.benchmarkId === reference.testCollection.benchmark){
                      expect(acl.access).to.be.equal("rw")
                      expect(acl.aclSources[0].grantee.name).to.be.equal("ACLCollisionGroup1")
                 }
                 else {
                      expect(acl.access).to.be.equal("r")
                      expect(acl.aclSources[0].grantee.name).to.be.equal("ACLCollisionGroup2")
                 }
              }
          }
      })
  })
})   


