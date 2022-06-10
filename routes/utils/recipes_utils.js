const axios = require("axios");
const dbUtils = require("./DButils")
const api_domain = "https://api.spoonacular.com/recipes";



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


function extractRecipeSummaryFromAPIResult(APIRecipe) {
    let whoCanEat;
    if (APIRecipe["vegan"])
        whoCanEat="vegan";
    else if (APIRecipe["vegetarian"])
        whoCanEat="vegetarian"
    else
        whoCanEat="meat"
    return {
        "id": APIRecipe["id"],
        "name": APIRecipe["title"],
        "timeToMake": APIRecipe["readyInMinutes"],
        "popularity": APIRecipe["aggregateLikes"],
        "whoCanEatVegOrNot": whoCanEat,
        "glutenFree": APIRecipe["glutenFree"],
        "image": APIRecipe["image"],
        "wasWatchedByUserBefore": true, //need to change here
        "wasSavedByUser": true // need to change here
    }
}

function extractFullRecipeDetailsFromAPIResult(recipe_info) {
    recipeFullDetails = extractRecipeSummaryFromAPIResult(recipe_info)
    recipeFullDetails["ingridients"] = recipe_info["extendedIngredients"].map(function(ingridientDict) {
        return ingridientDict["original"]
    }).join("\n")
    recipeFullDetails["instructions"] = recipe_info["instructions"]
    recipeFullDetails["numberOfMeals"] = recipe_info["servings"]
    return recipeFullDetails
}

async function getRandomRecipes() {
    let random_recipies = (await axios.get(`${api_domain}/random`, {
        params: {
            apiKey: process.env.api_token,
            number: 3
        }
    })).data["recipes"];
    return random_recipies.map(extractRecipeSummaryFromAPIResult);
}

async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
    }
}

async function getRecipesByName(recipeSearchName, numberOfRecipes) {
    let allResults = (await axios.get(`${api_domain}/complexSearch`, {
        params: {
            query: recipeSearchName,
            apiKey: process.env.spooncular_apiKey,
            number: numberOfRecipes,
            addRecipeInformation: true
        }
    })).data["results"];
    return allResults.map(extractRecipeSummaryFromAPIResult);
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
    return await Promise.all(recipeIDS.map(async function(recipe_id_dict) {
        let recipe_info = await getRecipeInformation(recipe_id_dict["recipeID"]);
        return extractRecipeSummaryFromAPIResult(recipe_info.data)
    }))
}

async function addRecepie(recipe_details){
    n = recipe_details.name
    timeToMake = recipe_details.timeToMake
    whoCanEatVegOrNot = recipe_details.whoCanEatVegOrNot,
    glutenFree = recipe_details.glutenFree,
    ingridients = recipe_details.ingridients,
    instructions = recipe_details.instructions,
    numberOfMeals = recipe_details.numberOfMeals
    return await dbUtils.execQuery(`insert into recipes values ('${n}','${timeToMake}', '${whoCanEatVegOrNot}', '${glutenFree}', '${ingridients}','${instructions}','${numberOfMeals}')`);
    // return "success"
}

async function getFullRecipe(user_name, recipeId) {
    let recipeToReturn;
    if (recipeId.startsWith("RE"))
        recipeToReturn = await dbUtils.getRecipeFullDetails(recipeId)
    else {
        let recipe_info = await getRecipeInformation(recipeId);
        recipeToReturn = extractFullRecipeDetailsFromAPIResult(recipe_info.data)
    }
    if (recipeToReturn) {
        await dbUtils.updateWatchedRecipe(user_name, recipeId)
    }
    return recipeToReturn

}

exports.getFullRecipe = getFullRecipe
exports.getUserRecipes = getUserRecipes
exports.getRecipesByName = getRecipesByName;
exports.getRecipeDetails = getRecipeDetails;
exports.addRecepie = addRecepie;
exports.getRandomRecipes = getRandomRecipes;



