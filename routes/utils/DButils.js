require("dotenv").config();
const MySql = require("./MySql");

exports.existsInDB = async function (column,table,id){
     var dicts = await execQuery("SELECT " + column + " from " + table);
     let flag = false;
     dicts.forEach(function f(dict){
        for (let key in dict){
          if (dict[key] == id){
            flag = true;
          }
        }
     });
    return flag;
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

exports.getRecipeFullDetails = async function(recipeId) {
    return await execQuery(`SELECT * FROM recipes WHERE recipeID='${recipeId}'`)
}

exports.getRecipeSummary = async function(recipeID) {
    return await execQuery(`SELECT recipeId,name,timeToMake,popularity,whoCanEatVegOrNot,glutenFree FROM recipes WHERE recipeID='${recipeID}'`)
}

exports.updateWatchedRecipe = async function(user_name, recipeId) {
    await execQuery(`DELETE FROM watchedRecipes WHERE recipeID='${recipeId}' AND username='${user_name}'`)
    await execQuery(`insert into watchedRecipes values ('${user_name}', '${recipeId}', '${new Date().toISOString().slice(0, 19).replace('T', ' ')}')`)
}

// exports.getRecipeFullDetails = getRecipeFullDetails
// exports.updateWatchedRecipe = updateWatchedRecipe