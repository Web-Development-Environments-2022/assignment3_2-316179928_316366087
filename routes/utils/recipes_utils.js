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
        "recipeID": APIRecipe["id"].toString(),
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
        return `<li>${ingridientDict["original"]}</li>`
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
        queryParams["diet"] = diet
    if (intolerances!=null)
        queryParams["intolerances"] = intolerances

    let allResults = (await axios.get(`${api_domain}/complexSearch`, {
        params: queryParams
    })).data["results"];
    return Promise.all(allResults.map(async function(x) { return await extractRecipeSummaryFromAPIResult(x, username)}));
}

async function getUserRecipes(username, query_type) {
    switch (query_type) {
        case "lastWatched":
            return await lastWatchedRecipes(username);
        case "favorite":
            return await favoriteRecipes(username);
        case "created":
            return await getRecipesCreatedByUser(username);
        default:
            throw { status: 402, message: "Invalid type of operation." };
    }
}

async function lastWatchedRecipes(username) {
    let recipeIDS = await dbUtils.execQuery(
        `SELECT recipeID from watchedRecipes WHERE username = '${username}' ORDER BY watchTime DESC LIMIT 3 `
    )
    recipeIDS = recipeIDS.map(function(x) {return x["recipeID"]})
    let results = []
    for (let i=0; i< recipeIDS.length; i++){
        let x = await getRecipeSummaryFromID(recipeIDS[i],username)
        results.push(x)
    }   
    return results
}

async function getRecipeSummaryFromID(recipeID, username) {
    if (recipeID.startsWith("RE")) {
        recipeToReturn = await dbUtils.getRecipeSummary(recipeID)
        recipeToReturn["wasWatchedByUserBefore"] = await wasRecipeWatchedByUser(username, recipeID)
        recipeToReturn["wasSavedByUser"] = await wasRecipeSavedByUser(username, recipeID)        
    }
    else {
        let recipe_info = await getRecipeInformation(recipeID);
        recipeToReturn = extractRecipeSummaryFromAPIResult(recipe_info.data, username)
    }
    
    return recipeToReturn
}

async function favoriteRecipes(username){
    let recipeIDS = await dbUtils.execQuery(
        `SELECT recipeID FROM FavoriteRecipes WHERE username = '${username}'`
    )
    recipeIDS = recipeIDS.map(function(x) {return x["recipeID"]})
    let results = []
    for (let i=0; i< recipeIDS.length; i++){
        let x = await getRecipeSummaryFromID(recipeIDS[i],username)
        results.push(x)
    }   
    return results
}

async function getRecipesCreatedByUser(username){
    let recipeIDS = await dbUtils.execQuery(
        `SELECT recipeID FROM recipes WHERE username = '${username}'`
    )
    recipeIDS = recipeIDS.map(function(x) {return x["recipeID"]})
    let results = []
    for (let i=0; i< recipeIDS.length; i++){
        let x = await getRecipeSummaryFromID(recipeIDS[i],username)
        results.push(x)
    }   
    return results
}

async function addRecepie(recipe_details){
    let dbnumber = await getDbNumber()
    ID = "RE" + dbnumber
    popularity = recipe_details.popularity
    username = recipe_details.username
    n = recipe_details.name
    timeToMake = recipe_details.timeToMake
    whoCanEatVegOrNot = recipe_details.whoCanEatVegOrNot,
    glutenFree = recipe_details.glutenFree,
    ingridients = recipe_details.ingridients,
    instructions = recipe_details.instructions,
    numberOfMeals = recipe_details.numberOfMeals
    picture = recipe_details.picture

    if (glutenFree == true)
        glutenFree = 1
    else
        glutenFree = 0
    return await dbUtils.execQuery(`INSERT INTO recipes values ('${ID}','${username}', '${n}','${timeToMake}','${popularity}', '${whoCanEatVegOrNot}','${glutenFree}','${ingridients}','${instructions}','${numberOfMeals}','${dbnumber}','${picture}')`);
}

async function getDbNumber(){
    let lastDBNumber = await dbUtils.execQuery(`SELECT dbnumber FROM recipes ORDER BY dbnumber DESC LIMIT 1`)
    if (lastDBNumber.length == 0){
        return 0;
    }
    lastDBNumber = lastDBNumber[0]["dbnumber"]
    return lastDBNumber + 1
}

async function getFullRecipe(username, recipeId, checkIfWatched) {
    let recipeToReturn;
    if (recipeId.startsWith("RE")) {
        recipeToReturn = await dbUtils.getRecipeFullDetails(recipeId)
        recipeToReturn["wasWatchedByUserBefore"] = await wasRecipeWatchedByUser(username, recipeId)
        recipeToReturn["wasSavedByUser"] = await wasRecipeSavedByUser(username, recipeId)        
    }
    else {
        let recipe_info;
        try{
            recipe_info = await getRecipeInformation(recipeId);
        }
        catch (error){
            if(error["response"]["status"] == 404){
                throw { status: 404, message: " recipe id wasnt found" };
            }
            throw { status: 500, message: "server error" };
        }
        recipeToReturn = await extractFullRecipeDetailsFromAPIResult(recipe_info.data, username)
    }
    if (recipeToReturn && checkIfWatched) {
        await dbUtils.updateWatchedRecipe(username, recipeId)
    }
    return recipeToReturn

}

exports.getFullRecipe = getFullRecipe
exports.getUserRecipes = getUserRecipes
exports.getRecipesByName = getRecipesByName;
exports.addRecepie = addRecepie;
exports.getRandomRecipes = getRandomRecipes;



