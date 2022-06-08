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
        const fullRecipe = await recipes_utils.getFullRecipe(req.query.recipeId)
        res.send(fullRecipe)
    } catch (error) {
        next(error);
    }
})

module.exports = router;