const express = require("express");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const app = express();
app.use(express.json());

const initializeDbServerToRespond = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running At http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
  }
};

initializeDbServerToRespond();

const convertToStateTable = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

const convertToDistinctTable = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};

//API-1

app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`;

  const states = await db.all(getStatesQuery);

  response.send(states.map((each) => convertToStateTable(each)));
});

//API-2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getStatesIdQuery = `SELECT * FROM state
  WHERE state_id = ${stateId};`;

  const states = await db.run(getStatesIdQuery);

  response.send(convertToStateTable(states));
});

//API-4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictQuery = `SELECT * FROM state
  WHERE district_id = ${districtId};`;

  const states = await db.get(getDistrictQuery);

  response.send(convertToDistinctTable(states));
});

//API-8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictDetailsQuery = `SELECT state_name FROM district NATURAL JOIN state
  WHERE district_id = ${districtId};`;

  const states = await db.get(getDistrictDetailsQuery);

  response.send(states.map({ stateName: states.state_name }));
});

//API-3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const postDistrictQuery = `INSERT INTO district(state_id, district_name, cases, cured, active, deaths)
    VALUES(
         ${districtName},
         ${stateId},
        ${cases},
         ${cured},
     ${active},
     ${deaths});`;

  await db.run(postDistrictQuery);
  response.send("District Successfully");
});

//API-5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteQuery = `DELETE FROM district WHERE district_id = ${districtId};`;

  await db.run(deleteQuery);

  response.send("District Removed");
});

//API-6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;

  const putDistrictQuery = `UPDATE district 
    SET 
        district_name = ${districtName},
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
        WHERE district_id =  ${districtId};`;

  await db.run(putDistrictQuery);

  response.send("District Details Updated");
});

//API-7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getStatesIdQuery = `SELECT 
    SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
    FROM district
    WHERE state_id = ${stateId};`;

  const results = await db.get(getStatesIdQuery);

  response.send({
    totalCases: totalCases,
    totalCured: totalCured,
    totalActive: totalActive,
    totalDeaths: totalDeaths,
  });
});

module.exports = app;
