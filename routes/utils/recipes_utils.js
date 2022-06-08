const axios = require("axios");
const DButils = require("./DButils");
const api_domain = "https://api.spoonacular.com/recipes";



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */



async function getRandomRecipes() {
    let random_recipies = (await axios.get(`${api_domain}/random`, {
        params: {
            apiKey: process.env.api_token,
            number: 3
        }
    })).data["recipes"];
    return random_recipies.map(function(recipe) {
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

async function addRecepie(recipe_details){
    n = recipe_details.name
    timeToMake = recipe_details.timeToMake
    whoCanEatVegOrNot = recipe_details.whoCanEatVegOrNot,
    glutenFree = recipe_details.glutenFree,
    ingridients = recipe_details.ingridients,
    instructions = recipe_details.instructions,
    numberOfMeals = recipe_details.numberOfMeals
    return await DButils.execQuery(`insert into recipes values ('${n}','${timeToMake}', '${whoCanEatVegOrNot}', '${glutenFree}', '${ingridients}','${instructions}','${numberOfMeals}')`);
    // return "success"

}




exports.getRecipeDetails = getRecipeDetails;
exports.addRecepie = addRecepie;
exports.getRandomRecipes = getRandomRecipes;



