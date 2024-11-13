
// will use the lvl1 user and the lvl3 manage user to test r rw and none 
// will first set the access level to an acl rule then attempt to write to that item and write outside to throw errors 

const chai = require("chai")
const chaiHttp = require("chai-http")
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
const { v4: uuidv4 } = require('uuid')
chai.use(chaiHttp)
chai.use(deepEqualInAnyOrder)
const expect = chai.expect
const config = require("../testConfig.json")
const utils = require("../utils/testUtils")
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

const lvl3 = {
    name: "lvl3",
    userId: "44",
    token: "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDkxMjUsImlhdCI6MTY3MDU2ODMyNSwiYXV0aF90aW1lIjoxNjcwNTY4MzI1LCJqdGkiOiI4NTI5MjZmZi0xYzM4LTQwMDYtOTYwYi1kOWE0YmNhMjcxZjkiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiIzNWZhYmMwNi0wNzZlLTRmZjQtOGJkZS1mMzI1ZWE3ZGQ0ZmIiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjQxNmMwYmJkLTJmNjktNGZkMC04MmE1LTdjZDBmNmRlNzUzNSIsInNlc3Npb25fc3RhdGUiOiIzMThkOGNmZi0wY2U1LTQ3MzktODEyYy1iNWI0NjdlMWQ2YzEiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6IjMxOGQ4Y2ZmLTBjZTUtNDczOS04MTJjLWI1YjQ2N2UxZDZjMSIsInByZWZlcnJlZF91c2VybmFtZSI6Imx2bDMifQ.KduimV7h4DSySAWBbWlpN1xwbfXBfNsscvx2qIx9SVAeZFSGbPZ0JtgThD9uray9xZjrk6qLNYnkoVyYQLS4M-pg8IlFp5yKJBCIeCpcTxA25MdV5VwZQcCD9pgwtEav-cgaDD2Ue6cHj_02cQGMClsfkJ2SuOUJ9nIu4B3m3Qk"
}

const lvl1TestAcl = {
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"r"},{"assetId":"154","access":"rw"}],
    response: [
        {
          access: "r",
          asset: {
            name: "Collection_X_asset",
            assetId: "62",
          },
          benchmarkId: "VPN_SRG_TEST",
          aclSources: [
            {
              aclRule: {
                label: {
                  name: "test-label-full",
                  labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
                },
                access: "r",
                benchmarkId: "VPN_SRG_TEST",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        },
        {
          access: "r",
          asset: {
            name: "Collection_X_lvl1_asset-1",
            assetId: "42",
          },
          benchmarkId: "VPN_SRG_TEST",
          aclSources: [
            {
              aclRule: {
                label: {
                  name: "test-label-full",
                  labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
                },
                access: "r",
                benchmarkId: "VPN_SRG_TEST",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: "Collection_X_lvl1_asset-2",
            assetId: "154",
          },
          benchmarkId: "VPN_SRG_TEST",
          aclSources: [
            {
              aclRule: {
                asset: {
                  name: "Collection_X_lvl1_asset-2",
                  assetId: "154",
                },
                access: "rw",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: "Collection_X_lvl1_asset-2",
            assetId: "154",
          },
          benchmarkId: "Windows_10_STIG_TEST",
          aclSources: [
            {
              aclRule: {
                asset: {
                  name: "Collection_X_lvl1_asset-2",
                  assetId: "154",
                },
                access: "rw",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        },
      ]
}

const lvl3TestAcl = {
  put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"r"}],
  response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
            grantee: {
              userId: 44,
              username: "lvl3",
              accessLevel: 3,
            },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
            grantee: {
              userId: 44,
              username: "lvl3",
              accessLevel: 3,
            },
          },
        ],
      },
      
    ]
}

describe(`Test Restricted user access controls`, () => {

    before(async function () {
        await utils.loadAppData()
    })

    it("should give lvl1 user restricted access to test collection", async () => {
      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}`)
          .set('Authorization', `Bearer ${admin.token}`)
          .send({
            "accessLevel": 1
          })
      expect(res).to.have.status(201)
    })
    it("Remove Base appdata userGroup from test Colleciton", async () => {

      const res = await chai.request(config.baseUrl)  
        .delete(`/collections/${reference.testCollection.collectionId}/grants/user-group/${reference.testCollection.testGroup.userGroupId}`)
        .set('Authorization', `Bearer ${admin.token}`)

      expect(res).to.have.status(200)
    })
    it(`should set users ACL in test collection `, async () => {
        const res = await chai.request(config.baseUrl)
            .put(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send(lvl1TestAcl.put)
        expect(res).to.have.status(200)
        // needs tesitng but as of rn the endpont is broke 
    })
    it("should confirm users effective acl was set ", async () => {
        const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
            .set('Authorization', `Bearer ${admin.token}`)
            expect(res).to.have.status(200)
        expect(res.body).to.deep.equalInAnyOrder(lvl1TestAcl.response)
    })
    it("should get reviews that is associated with the ACL and confirm that is it all read only.", async () => {

        const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/reviews?rules=default-mapped`)
            .set('Authorization', `Bearer ${lvl1.token}`)
            expect(res).to.have.status(200)

        for(const review of res.body){
            if(review.assetId === "154"){
                expect(review.access).to.equal("rw")
            }
            else if (review.assetId === reference.testAsset.assetId){
                expect(review.access).to.equal("r")
            }
            // sanity check
            if(review.assetId === reference.testAsset.assetId && review.ruleId === reference.testCollection.ruleId){
                expect(review.access, "expect that the test rule exists and is read only").to.equal("r")
            }
        }
    })
    it("should reject PUT modification to reviews that is associated with the ACLs that are read only", async () => {

      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl1.token}`)
          .send({
            result: 'pass',
            detail: '',
            comment: 'sure',
            status: 'accepted',
            autoResult: false
          })
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("no grant for this asset/ruleId")
    })
    it("should reject PATCH modification to read only review on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl1.token}`)
          .send({
            result: 'pass',
          })
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("no grant for this asset/ruleId")
    })
    it("should reject DELETE modification to read only review on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl1.token}`)
         
      expect(res).to.have.status(403)
    })
    it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
          .set('Authorization', `Bearer ${lvl1.token}`)
          .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")

    })
    it("should reject patch modification to read only review metadata on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
          .set('Authorization', `Bearer ${lvl1.token}`)
          .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("User has insufficient privilege to patch the review of this rule.")
      
    })
    it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
          .set('Authorization', `Bearer ${lvl1.token}`)
          .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")
    })
    it('should reject delete modification  of metadata key to read only review metadata on test asset with test ruleId', async () => {
      const res = await chai.request(config.baseUrl)
        .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}/metadata/keys/${reference.reviewMetadataKey}`)
        .set('Authorization', `Bearer ${lvl1.token}`)
        .send(`${JSON.stringify(reference.reviewMetadataValue)}`)
    
      expect(res).to.have.status(403)
    })
})

describe(`Test manage user access control`, () => {`  `

    before(async function () {
        await utils.loadAppData()
    })
    it(`should set users ACL in test collection `, async () => {
        const res = await chai.request(config.baseUrl)
            .put(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl3.userId}/access`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send(lvl3TestAcl.put)
        expect(res).to.have.status(200)
        // needs tesitng but as of rn the endpont is broke 
    })
    it("should confirm users effective acl was set ", async () => {
        const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl3.userId}/access/effective`)
            .set('Authorization', `Bearer ${admin.token}`)
            expect(res).to.have.status(200)
        expect(res.body).to.deep.equalInAnyOrder(lvl3TestAcl.response)
    })
    it("should get reviews that is associated with the ACL and confirm that is it all read only.", async () => {

        const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/reviews?rules=default-mapped`)
            .set('Authorization', `Bearer ${lvl3.token}`)
            expect(res).to.have.status(200)

        for(const review of res.body){
            if (review.assetId === reference.testAsset.assetId && review.ruleId === reference.testCollection.ruleId){
                expect(review.access).to.equal("r")
            }
            if(review.assetId === "62"){
                expect(review.access).to.equal("r")
            }
            if(review.assetId === "154"){
                expect(review.access).to.equal("rw")
            }
        }
    })
    it("should reject POST  modification to reviews that is associated with the ACLs that are read only", async () => {
      

      const res = await chai.request(config.baseUrl)
          .post(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}`)
          .set('Authorization', `Bearer ${lvl3.token}`)
          .send([
            {
            "ruleId": reference.testCollection.ruleId,
            "result": "pass",
            "detail": "test\nvisible to lvl1",
            "comment": "sure",
            "autoResult": false,
            "status": "submitted"
            }
        ])
      expect(res).to.have.status(200)
      expect(res.body.rejected).to.have.length(1)
      expect(res.body.rejected[0].reason).to.equal("no grant for this asset/ruleId")
    })
    it("should reject PUT modification to reviews that is associated with the ACLs that are read only", async () => {

      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl3.token}`)
          .send({
            result: 'pass',
            detail: '',
            comment: 'sure',
            status: 'accepted',
            autoResult: false
          })
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("no grant for this asset/ruleId")
    })
    it("should reject PATCH modification to read only review on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl3.token}`)
          .send({
            result: 'pass',
          })
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("no grant for this asset/ruleId")
    })
    it("should reject DELETE modification to read only review on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl3.token}`)
         
      expect(res).to.have.status(403)
    })
    it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
          .set('Authorization', `Bearer ${lvl3.token}`)
          .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")

    })
    it("should reject patch modification to read only review metadata on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
          .set('Authorization', `Bearer ${lvl3.token}`)
          .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("User has insufficient privilege to patch the review of this rule.")
      
    })
    it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
          .set('Authorization', `Bearer ${lvl3.token}`)
          .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")
    })
    it('should reject delete modification  of metadata key to read only review metadata on test asset with test ruleId', async () => {
      const res = await chai.request(config.baseUrl)
        .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}/metadata/keys/${reference.reviewMetadataKey}`)
        .set('Authorization', `Bearer ${lvl3.token}`)
        .send(`${JSON.stringify(reference.reviewMetadataValue)}`)
    
      expect(res).to.have.status(403)
    })
})

describe("Test restricted user group access controls", ()  => {

  before(async function () {
    await utils.loadAppData()
  })
  let userGroup = null

  it("Remove Base appdata userGroup from test Colleciton", async () => {

    const res = await chai.request(config.baseUrl)  
      .delete(`/collections/${reference.testCollection.collectionId}/grants/user-group/${reference.testCollection.testGroup.userGroupId}`)
      .set('Authorization', `Bearer ${admin.token}`)

    expect(res).to.have.status(200)
  })
  // make a group with lvl1 in it
  it('should create a userGroup', async () => {
    const res = await chai
        .request(config.baseUrl)
        .post(`/user-groups?elevate=true&projection=collections&projection=users`)
        .set('Authorization', 'Bearer ' + admin.token)
        .send({
          "name": "group" +  uuidv4(),
          "description": "test group",
          "userIds": [
            lvl1.userId      
          ]
      })
      userGroup = res.body
      expect(res).to.have.status(201)
      expect(res.body.collections).to.be.empty
      for(let user of res.body.users) {
        expect(user.userId, "expect userId to be equal to the userId returned from API").to.equal(lvl1.userId)
        expect(user.username, "expect username to be equal to the username returned from API").to.equal(lvl1.name)
      }
  }) 
  it("should delete lvl1 users direct grant to test collection", async () => {

    const res = await chai.request(config.baseUrl)
      .delete(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}`)
      .set('Authorization', `Bearer ${admin.token}`)
    expect(res).to.have.status(200)

  })
  // assign group to test collection with restricted 
  it("should assign group created to the test collection with restricted grant", async function () {

    const res = await chai.request(config.baseUrl)
    .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup.userGroupId}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      accessLevel: 1
    })
    expect(res).to.have.status(201)
    expect(res.body.accessLevel).to.equal(1)
  })
  // give it read only to something use lvl1TEstAcl object
  it("should set userGroups ACL in test collection", async () => {

    const res = await chai.request(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup.userGroupId}/access`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send(lvl1TestAcl.put)

        expect(res).to.have.status(200)
        expect(res.body.defaultAccess).to.equal("none")
  })
  // get the effective acl and confirm that it is read only and grantee from the group
  it("should confirm users effective acl was set ", async () => {
    const res = await chai.request(config.baseUrl)
        .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
        .set('Authorization', `Bearer ${admin.token}`)
    expect(res).to.have.status(200)
    
    for(const acl of res.body){
      if(acl.asset.assetId === reference.testAsset.assetId){
        expect(acl.access).to.equal("r")
        expect(acl.aclSources[0].grantee.userGroupId).to.equal(parseInt(userGroup.userGroupId))
      }
    }
  })
  it("should get reviews that is associated with the ACL and confirm that is it all read only.", async () => {

    const res = await chai.request(config.baseUrl)
        .get(`/collections/${reference.testCollection.collectionId}/reviews?rules=default-mapped`)
        .set('Authorization', `Bearer ${lvl1.token}`)
    expect(res).to.have.status(200)

    for(const review of res.body){
        if(review.assetId === "154"){
            expect(review.access).to.equal("rw")
        }
        else if (review.assetId === reference.testAsset.assetId){
            expect(review.access).to.equal("r")
        }
        // sanity check
        if(review.assetId === reference.testAsset.assetId && review.ruleId === reference.testCollection.ruleId){
            expect(review.access, "expect that the test rule exists and is read only").to.equal("r")
        }
    }
  })
  it("should reject PUT modification to reviews that is associated with the ACLs that are read only", async () => {
      
      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl1.token}`)
          .send({
            result: 'pass',
            detail: '',
            comment: 'sure',
            status: 'accepted',
            autoResult: false
          })
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("no grant for this asset/ruleId")
  })
  it("should reject PATCH modification to read only review on test asset with test ruleId", async () => {
      
      const res = await chai.request(config.baseUrl)
          .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl1.token}`)
          .send({
            result: 'pass',
          })
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("no grant for this asset/ruleId")
  })
  it("should reject DELETE modification to read only review on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
        .set('Authorization', `Bearer ${lvl1.token}`)
        
    expect(res).to.have.status(403)
  })
  it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
        .set('Authorization', `Bearer ${lvl1.token}`)
        .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")

  })
  it("should reject patch modification to read only review metadata on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
        .set('Authorization', `Bearer ${lvl1.token}`)
        .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("User has insufficient privilege to patch the review of this rule.")
    
  })
  it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
        .set('Authorization', `Bearer ${lvl1.token}`)
        .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")
  })
  it('should reject delete modification  of metadata key to read only review metadata on test asset with test ruleId', async () => {
    const res = await chai.request(config.baseUrl)
      .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}/metadata/keys/${reference.reviewMetadataKey}`)
      .set('Authorization', `Bearer ${lvl1.token}`)
      .send(`${JSON.stringify(reference.reviewMetadataValue)}`)
  
    expect(res).to.have.status(403)
  })

})

describe(`Test a restricted users access (r,rw,none)`, () => {

  before(async function () {
      await utils.loadAppData()
  })

  it("should give lvl1 user restricted access to test collection", async () => {
    const res = await chai.request(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          "accessLevel": 1
        })
    expect(res).to.have.status(201)
  })
  it("Remove Base appdata userGroup from test Colleciton", async () => {

    const res = await chai.request(config.baseUrl)  
      .delete(`/collections/${reference.testCollection.collectionId}/grants/user-group/${reference.testCollection.testGroup.userGroupId}`)
      .set('Authorization', `Bearer ${admin.token}`)

    expect(res).to.have.status(200)
  })
  it(`should set users ACL in test collection `, async () => {
      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access`)
          .set('Authorization', `Bearer ${admin.token}`)
          .send(lvl1TestAcl.put)
      expect(res).to.have.status(200)
      // needs tesitng but as of rn the endpont is broke 
  })
  it("should confirm users effective acl was set ", async () => {
      const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
          .set('Authorization', `Bearer ${admin.token}`)
          expect(res).to.have.status(200)
      expect(res.body).to.deep.equalInAnyOrder(lvl1TestAcl.response)
  })
  it("should get reviews that is associated with the ACL and confirm that is it all read only.", async () => {

      const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}/reviews?rules=default-mapped`)
          .set('Authorization', `Bearer ${lvl1.token}`)
          expect(res).to.have.status(200)

      for(const review of res.body){
          if(review.assetId === "154"){
              expect(review.access).to.equal("rw")
          }
          else if (review.assetId === reference.testAsset.assetId){
              expect(review.access).to.equal("r")
          }
          // sanity check
          if(review.assetId === reference.testAsset.assetId && review.ruleId === reference.testCollection.ruleId){
              expect(review.access, "expect that the test rule exists and is read only").to.equal("r")
          }
      }
  })
  it("should reject PUT modification to reviews that is associated with the ACLs that are read only", async () => {

    const res = await chai.request(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
        .set('Authorization', `Bearer ${lvl1.token}`)
        .send({
          result: 'pass',
          detail: '',
          comment: 'sure',
          status: 'accepted',
          autoResult: false
        })
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("no grant for this asset/ruleId")
  })
  it("should reject PATCH modification to read only review on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
        .set('Authorization', `Bearer ${lvl1.token}`)
        .send({
          result: 'pass',
        })
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("no grant for this asset/ruleId")
  })
  it("should reject DELETE modification to read only review on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
        .set('Authorization', `Bearer ${lvl1.token}`)
       
    expect(res).to.have.status(403)
  })
  it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
        .set('Authorization', `Bearer ${lvl1.token}`)
        .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")

  })
  it("should reject patch modification to read only review metadata on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
        .set('Authorization', `Bearer ${lvl1.token}`)
        .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("User has insufficient privilege to patch the review of this rule.")
    
  })
  it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
        .set('Authorization', `Bearer ${lvl1.token}`)
        .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")
  })
  it('should reject delete modification  of metadata key to read only review metadata on test asset with test ruleId', async () => {
    const res = await chai.request(config.baseUrl)
      .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}/metadata/keys/${reference.reviewMetadataKey}`)
      .set('Authorization', `Bearer ${lvl1.token}`)
      .send(`${JSON.stringify(reference.reviewMetadataValue)}`)
  
    expect(res).to.have.status(403)
  })
})

describe(`Test manage user access (r,rw,none)`, () => {`  `

  before(async function () {
      await utils.loadAppData()
  })
  it(`should set users ACL in test collection `, async () => {
      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl3.userId}/access`)
          .set('Authorization', `Bearer ${admin.token}`)
          .send(lvl3TestAcl.put)
      expect(res).to.have.status(200)
      // needs tesitng but as of rn the endpont is broke 
  })
  it("should confirm users effective acl was set ", async () => {
      const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl3.userId}/access/effective`)
          .set('Authorization', `Bearer ${admin.token}`)
          expect(res).to.have.status(200)
      expect(res.body).to.deep.equalInAnyOrder(lvl3TestAcl.response)
  })
  it("should get reviews that is associated with the ACL and confirm that is it all read only.", async () => {

      const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}/reviews?rules=default-mapped`)
          .set('Authorization', `Bearer ${lvl3.token}`)
          expect(res).to.have.status(200)

      for(const review of res.body){
          if (review.assetId === reference.testAsset.assetId && review.ruleId === reference.testCollection.ruleId){
              expect(review.access).to.equal("r")
          }
          if(review.assetId === "62"){
              expect(review.access).to.equal("r")
          }
          if(review.assetId === "154"){
              expect(review.access).to.equal("rw")
          }
      }
  })
  it("should reject POST  modification to reviews that is associated with the ACLs that are read only", async () => {
    

    const res = await chai.request(config.baseUrl)
        .post(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}`)
        .set('Authorization', `Bearer ${lvl3.token}`)
        .send([
          {
          "ruleId": reference.testCollection.ruleId,
          "result": "pass",
          "detail": "test\nvisible to lvl1",
          "comment": "sure",
          "autoResult": false,
          "status": "submitted"
          }
      ])
    expect(res).to.have.status(200)
    expect(res.body.rejected).to.have.length(1)
    expect(res.body.rejected[0].reason).to.equal("no grant for this asset/ruleId")
  })
  it("should reject PUT modification to reviews that is associated with the ACLs that are read only", async () => {

    const res = await chai.request(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
        .set('Authorization', `Bearer ${lvl3.token}`)
        .send({
          result: 'pass',
          detail: '',
          comment: 'sure',
          status: 'accepted',
          autoResult: false
        })
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("no grant for this asset/ruleId")
  })
  it("should reject PATCH modification to read only review on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
        .set('Authorization', `Bearer ${lvl3.token}`)
        .send({
          result: 'pass',
        })
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("no grant for this asset/ruleId")
  })
  it("should reject DELETE modification to read only review on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
        .set('Authorization', `Bearer ${lvl3.token}`)
       
    expect(res).to.have.status(403)
  })
  it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
        .set('Authorization', `Bearer ${lvl3.token}`)
        .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")

  })
  it("should reject patch modification to read only review metadata on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
        .set('Authorization', `Bearer ${lvl3.token}`)
        .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("User has insufficient privilege to patch the review of this rule.")
    
  })
  it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
        .set('Authorization', `Bearer ${lvl3.token}`)
        .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")
  })
  it('should reject delete modification  of metadata key to read only review metadata on test asset with test ruleId', async () => {
    const res = await chai.request(config.baseUrl)
      .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}/metadata/keys/${reference.reviewMetadataKey}`)
      .set('Authorization', `Bearer ${lvl3.token}`)
      .send(`${JSON.stringify(reference.reviewMetadataValue)}`)
  
    expect(res).to.have.status(403)
  })
})