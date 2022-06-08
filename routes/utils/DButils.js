require("dotenv").config();
const MySql = require("./MySql");

exports.existsInDB = async function (column,table,username){
     let lst = await execQuery("SELECT " + column + " from " + table);
     return lst.find((x) => x.username === username)
}

exports.execQuery = async function (query) {
    let returnValue = []
const connection = await MySql.connection();
    try {
    await connection.query("START TRANSACTION");
    returnValue = await connection.query(query);
  } catch (err) {
    await connection.query("ROLLBACK");
    console.log('ROLLBACK at querySignUp', err);
    throw err;
  } finally {
    await connection.release();
  }
  return returnValue
}
async function execQuery (query) {
  let returnValue = []
const connection = await MySql.connection();
  try {
  await connection.query("START TRANSACTION");
  returnValue = await connection.query(query);
} catch (err) {
  await connection.query("ROLLBACK");
  console.log('ROLLBACK at querySignUp', err);
  throw err;
} finally {
  await connection.release();
}
return returnValue
}
