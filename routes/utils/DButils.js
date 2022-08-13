require("dotenv").config();
const MySql = require("./MySql");

exports.existsInDB = async function (column,table,id){
     var dicts = await execQuery("SELECT " + column + " from " + table);
     var flag = false;
     console.log(dicts)

     dicts.forEach(function f(dict){
        if (dict[column] == id.toString()){
          flag = true;
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
    res = ((await execQuery(`SELECT * FROM recipes WHERE recipeID='${recipeId}'`))[0])
    if (res == undefined){
      throw { status: 404, message: "Sorry, we didnt found your recipe." };
    }
    delete res["username"]
    delete res["dbnumber"]
    return res
}

exports.getRecipeSummary = async function(recipeID) { 
  let x = (await execQuery(`SELECT recipeID,name,timeToMake,image,popularity,whoCanEatVegOrNot,glutenFree FROM recipes WHERE recipeID='${recipeID}'`))
  return x[0]
}

exports.updateWatchedRecipe = async function(user_name, recipeId) {
    await execQuery(`insert into watchedRecipes values ('${user_name}', '${recipeId}', '${new Date().toISOString().slice(0, 19).replace('T', ' ')}')`)
}

// exports.getRecipeFullDetails = getRecipeFullDetails
// exports.updateWatchedRecipe = updateWatchedRecipe



