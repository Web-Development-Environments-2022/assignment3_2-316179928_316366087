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
    return allResults.map(function(recipe) {
        let whoCanEat;
        if (recipe["vegan"])
            whoCanEat="vegan";
        else if (recipe["vegetarian"])
            whoCanEat="vegetarian"
        else
            whoCanEat="meat"
        return {
            "id": recipe["id"],
            "name": recipe["title"],
            "timeToMake": recipe["readyInMinutes"],
            "popularity": recipe["aggregateLikes"],
            "whoCanEatVegOrNot": whoCanEat,
            "glutenFree": recipe["glutenFree"],
            "image": recipe["image"],
            "wasWatchedByUserBefore": true, //need to change here
            "wasSavedByUser": true // need to change here
        }
    });
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

async function lastWatched(user_name) {
    let recipeIDS = await dbUtils.execQuery(
        `SELECT TOP 3 recipeID from watchedRecipes WHERE username = '${user_name}' ORDER BY watchTime DESC`
    )
}

exports.getRecipesByName = getRecipesByName;
exports.getRecipeDetails = getRecipeDetails;



