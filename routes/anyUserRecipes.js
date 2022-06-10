var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
router.get("/getRandomRecipes",async (req, res, next) => {
    try {
      random_recipies = await recipes_utils.getRandomRecipes();
      res.send(random_recipies)
    }
    catch(error){
      next(error)
    }
  });
/**
 * This path return a full details of number of recipes by their name, using the spooncular api
 */
 router.get("/searchRecipe", async (req, res, next) => { // maybe need to add here search query to cookies
    try {
        const recipes = await recipes_utils.getRecipesByName(req.query.recipeSearchName, req.query.numberOfRecipes);
        res.send(recipes);
    } catch (error) {
        next(error);
    }
});

router.get("/getUserRecipes", async(req, res, next) => {
    try {
        let user_name = "eitan" //change to cookie
        const recipes = await recipes_utils.getUserRecipes(user_name, req.query.type);
        res.send(recipes);
    } catch (error) {
        next(error);
    }
})

router.get("/recipe", async(req, res, next) => {
    try {
        let user_name = "eitan"
        const fullRecipe = await recipes_utils.getFullRecipe(user_name, req.query.recipeId)
        res.send(fullRecipe)
    } catch (error) {
        next(error);
    }
})

module.exports = router;

// async function getRecipeFullDetails(recipeId) {
//     let recipe = await execQuery(`SELECT * FROM recipes WHERE recipeID='${recipeId}'`)

// }

// exports.updateWatchedRecipe = async function(user_name, recipeId) {
//     await execQuery(`DELETE FROM watchedRecipes WHERE recipeID='${recipeId}' AND username='${user_name}'`)
//     await execQuery(`insert into watchedRecipes values ('${user_name}', '${recipeId}', '${new Date().toISOString().slice(0, 19).replace('T', ' ')}')`)
// }

// // exports.getRecipeFullDetails = getRecipeFullDetails
// // exports.updateWatchedRecipe = updateWatchedRecipe