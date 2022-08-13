const DButils = require("./DButils");
const rutils = require("./recipes_utils");

async function markAsFavorite(user_id, recipe_id){
    await rutils.getFullRecipe(user_id,recipe_id, false) //throw error if not exists
    try{
        await DButils.execQuery(`insert into favoriterecipes values ('${recipe_id}','${user_id}')`);
    }
    catch(error){
        if (error.errno == 1062){
            throw { status: 409, message: "recipe already added to favorites" };
        }
        else{
            throw error
        }
    }
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from FavoriteRecipes where user_id='${user_id}'`);
    return recipes_id;
}


async function getMyFamilyDishes(username){ 
    const recipes_id = await DButils.execQuery(`select * from family where username='${username}'`);
    return recipes_id;
}


exports.getMyFamilyDishes = getMyFamilyDishes;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
