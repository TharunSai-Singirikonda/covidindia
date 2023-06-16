const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};

initializeDBServer();

const convertDBObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictObjectToResponseObject = (districtObject) => {
  return {
    districtId: districtObject.district_id,
    districtName: districtObject.district_name,
    stateId: districtObject.state_id,
    cured: districtObject.cured,
    active: districtObject.active,
    deaths: districtObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const statesQuery = `
    SELECT * FROM state`;
  const states = await db.all(statesQuery);
  response.send(
    states.map((eachState) => convertDBObjectToResponseObject(eachState))
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state WHERE state_id=${stateId}`;
  const getState = await db.get(getStateQuery);
  response.send(convertDBObjectToResponseObject(getState));
});

app.post("/districts/", async (request, response) => {
  const {
    districtId,
    districtName,
    stateId,
    cured,
    active,
    deaths,
  } = request.body;
  const newDistrict = `
    INSERT INTO district ( 
        district_name,state_id,cured,active,deaths)
    VALUES
   ( "${districtName}","${stateId}","${cured}","${active}","${deaths}")
        `;
  await db.run(newDistrict);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictArray = `select * from district where district_id=${districtId}`;
  const district = await db.get(getDistrictArray);
  response.send(convertDistrictObjectToResponseObject(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDetails = `delete from district where district_id=${districtId}`;
  const deleteddistrict = await db.run(deleteDetails);
  response.send("District Removed");
});

app.put("/districts/:districtId/", (request, response) => {
  const {
    districtId,
    districtName,
    stateId,
    cured,
    active,
    deaths,
  } = request.body;
  const query = `update district set 
       
       district_name="${districtName}",
       state_id="${stateId}",
       cured="${cured}",
       active="${active}",
       deaths="${deaths}"
  `;
  const details = db.run(query);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateByIDStatsQuery = `select sum(cases) as totalCases, sum(cured) as totalCured,
    sum(active) as totalActive , sum(deaths) as totalDeaths from district where state_id = ${stateId};`;

  const getStateByIDStatsQueryResponse = await db.get(getStateByIDStatsQuery);
  response.send(getStateByIDStatsQueryResponse);
});
module.exports = app;
