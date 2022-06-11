const axios = require("axios");
const dbUtils = require("./DButils")
const api_domain = "https://api.spoonacular.com/recipes";



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */

 async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}


async function extractRecipeSummaryFromAPIResult(APIRecipe, username) {
    let whoCanEat;
    if (APIRecipe["vegan"])
        whoCanEat="vegan";
    else if (APIRecipe["vegetarian"])
        whoCanEat="vegetarian"
    else
        whoCanEat="meatLovers"
    let x = await wasRecipeWatchedByUser(username, APIRecipe["id"])
    let y = await wasRecipeSavedByUser(username, APIRecipe["id"])
    let check = {
        "recipeID": APIRecipe["id"],
        "name": APIRecipe["title"],
        "timeToMake": APIRecipe["readyInMinutes"],
        "popularity": APIRecipe["aggregateLikes"],
        "whoCanEatVegOrNot": whoCanEat,
        "glutenFree": APIRecipe["glutenFree"],
        "image": APIRecipe["image"],
        "wasWatchedByUserBefore": x, 
        "wasSavedByUser": y
    }
    return check
}


async function wasRecipeWatchedByUser(username, recipeID) {
    return (await dbUtils.execQuery(`SELECT * FROM watchedRecipes WHERE username = '${username}' AND recipeID = '${recipeID}'`)).length>0
}

async function wasRecipeSavedByUser(username, recipeID) {
    return (await dbUtils.execQuery(`SELECT * FROM favoriterecipes WHERE username = '${username}' AND recipeID = '${recipeID}'`)).length>0
}

async function extractFullRecipeDetailsFromAPIResult(recipe_info, username) {
    recipeFullDetails = await extractRecipeSummaryFromAPIResult(recipe_info, username)
    recipeFullDetails["ingridients"] = recipe_info["extendedIngredients"].map(function(ingridientDict) {
        return ingridientDict["original"]
    }).join("\n")
    recipeFullDetails["instructions"] = recipe_info["instructions"]
    recipeFullDetails["numberOfMeals"] = recipe_info["servings"]
    return recipeFullDetails
}

async function getRandomRecipes(username) {
    let random_recipies = (await axios.get(`${api_domain}/random`, {
        params: {
            apiKey: process.env.spooncular_apiKey,
            number: 3
        }
    })).data["recipes"];
    return Promise.all(random_recipies.map(async function(x) { return await extractRecipeSummaryFromAPIResult(x, username)}));
}


async function getRecipesByName(recipeSearchName, numberOfRecipes, cuisine, diet, intolerances, username) {
    let queryParams = {
        query: recipeSearchName,
        apiKey: process.env.spooncular_apiKey,
        number: numberOfRecipes,
        addRecipeInformation: true
    }
    if (cuisine!=undefined)
        queryParams["cuisine"] = cuisine
    if (diet!=undefined)
        queryParams["diet"] = cuisine
    if (intolerances!=null)
        queryParams["intolerances"] = cuisine

    let allResults = (await axios.get(`${api_domain}/complexSearch`, {
        params: queryParams
    })).data["results"];
    return Promise.all(allResults.map(async function(x) { return await extractRecipeSummaryFromAPIResult(x, username)}));
}

async function getUserRecipes(user_name, query_type) {
    switch (query_type) {
        case "lastWatched":
            return await lastWatchedRecipes(user_name);
        case "favorite":
            return await favoriteRecipes(user_name);
        case "created":
            return await getRecipesCreatedByUser(user_name);
        default:
            throw { status: 402, message: "Invalid type of operation." };
    }
}

async function lastWatchedRecipes(user_name) {
    let recipeIDS = await dbUtils.execQuery(
        `SELECT recipeID from watchedRecipes WHERE username = '${user_name}' ORDER BY watchTime DESC LIMIT 3 `
    )
    recipeIDS = recipeIDS.map(function(x) {return x["recipeID"]})
    return await Promise.all(recipeIDS.map( async function(recipeID) {return await getRecipeSummaryFromID(recipeID, user_name)}))
}

async function getRecipeSummaryFromID(recipeID, user_name) {
    if (recipeID.startsWith("RE")) {
        recipeToReturn = await dbUtils.getRecipeSummary(recipeID)
        recipeToReturn["wasWatchedByUserBefore"] = await wasRecipeWatchedByUser(username, APIRecipe["id"])
        recipeToReturn["wasSavedByUser"] = await wasRecipeSavedByUser(username, APIRecipe["id"])        
    }
    else {
        let recipe_info = await getRecipeInformation(recipeID);
        recipeToReturn = extractRecipeSummaryFromAPIResult(recipe_info.data, user_name)
    }
    return recipeToReturn
}

async function favoriteRecipes(user_name){
    let recipeIDS = await dbUtils.execQuery(
        `SELECT recipeID FROM FavoriteRecipes WHERE username = '${user_name}'`
    )
    recipeIDS = recipeIDS.map(function(x) {return x["recipeID"]})
    return await Promise.all(recipeIDS.map(async function(recipeID) {return await getRecipeSummaryFromID(recipeID, user_name)}))
}

async function getRecipesCreatedByUser(user_name){
    let recipeIDS = await dbUtils.execQuery(
        `SELECT recipeID FROM recipes WHERE username = '${user_name}'`
    )
    recipeIDS = recipeIDS.map(function(x) {return x["recipeID"]})
    return await Promise.all(recipeIDS.map(async function(recipeID) {return await getRecipeSummaryFromID(recipeID, user_name)}))    
}

async function addRecepie(recipe_details){
    let dbnumber = await getDbNumber()
    ID = "RE" + recipe_details.recipeID
    user_name = recipe_details.username
    n = recipe_details.name
    timeToMake = recipe_details.timeToMake
    whoCanEatVegOrNot = recipe_details.whoCanEatVegOrNot,
    glutenFree = recipe_details.glutenFree,
    ingridients = recipe_details.ingridients,
    instructions = recipe_details.instructions,
    numberOfMeals = recipe_details.numberOfMeals
    return await dbUtils.execQuery(`INSERT INTO recipes values ('${ID}','${user_name}', '${n}','${timeToMake}', '${whoCanEatVegOrNot}','${glutenFree}','${ingridients}','${instructions}','${numberOfMeals}','${dbnumber}')`);
}

async function getDbNumber(){
    let lastDBNumber = await dbUtils.execQuery(`SELECT dbnumber FROM recipes ORDER BY dbnumber DESC LIMIT 1`)
    lastDBNumber = lastDBNumber[0]["dbnumber"]
    return lastDBNumber + 1
}

async function getFullRecipe(user_name, recipeId) {
    let recipeToReturn;
    if (recipeId.startsWith("RE")) {
        recipeToReturn = await dbUtils.getRecipeFullDetails(recipeId)
        recipeToReturn["wasWatchedByUserBefore"] = await wasRecipeWatchedByUser(username, APIRecipe["id"])
        recipeToReturn["wasSavedByUser"] = await wasRecipeSavedByUser(username, APIRecipe["id"])        
    }
    else {
        let recipe_info = await getRecipeInformation(recipeId);
        recipeToReturn = await extractFullRecipeDetailsFromAPIResult(recipe_info.data, user_name)
    }
    if (recipeToReturn) {
        await dbUtils.updateWatchedRecipe(user_name, recipeId)
    }
    return recipeToReturn

}

exports.getFullRecipe = getFullRecipe
exports.getUserRecipes = getUserRecipes
exports.getRecipesByName = getRecipesByName;
exports.addRecepie = addRecepie;
exports.getRandomRecipes = getRandomRecipes;



