var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");


router.get("/", (req, res) => res.send("im here"));

/**
 * This path return a full details of number of recipes by their name, using the spooncular api
 */
 router.get("/searchRecipe", async (req, res, next) => { // maybe need to add here search query to cookies
  try {
      let user_name = req.session.username
      const recipes = await recipes_utils.getRecipesByName(req.query.recipeSearchName, req.query.numberOfRecipes, req.query.cuisine, req.query.diet, req.query.intolerances, user_name);
      res.send(recipes);
  } catch (error) {
      next(error);
  }
});

router.use(async function (req, res, next) {
    if (req.session && req.session.username) {
      DButils.execQuery("SELECT username FROM users").then((users) => {
        if (users.find((x) => x.username === req.session.username)) {
          req.username = req.session.username;
          next();
        }
      }).catch(err => next(err));
    } else {
      res.sendStatus(401);
    }
  });

/**
 * This path returns a full details of a recipe by its id
 */
// router.get("/:recipeId", async (req, res, next) => {
//   try { 
//     const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
//     res.send(recipe);
//   } catch (error) {
//     next(error);
//   }
// });

router.get("/getRandomRecipes",async (req, res, next) => {
    try {
      let user_name = req.session.username
      if (user_name == null){
        user_name = "stam"
      }
      random_recipies = await recipes_utils.getRandomRecipes(user_name);
      res.send(random_recipies)
    }
    catch(error){
      next(error)
    }
  });


router.get("/getUserRecipes", async(req, res, next) => {
    try {
        let user_name = req.session.username //change to cookie
        const recipes = await recipes_utils.getUserRecipes(user_name, req.query.type);
        res.send(recipes);
    } catch (error) {
        next(error);
    }
})

router.get("/recipe", async(req, res, next) => {
    try {
        let user_name = req.session.username
        const fullRecipe = await recipes_utils.getFullRecipe(user_name, req.query.recipeId)
        res.send(fullRecipe)
    } catch (error) {
        next(error);
    }
})

router.post('/recipe', async (req,res,next) => {
    
    try{
      let recipe_details = {
        recipeID: req.body.recipeID,
        username: req.session.username,
        name: req.body.name,
        popularity: 10,
        timeToMake: req.body.timeToMake,
        whoCanEatVegOrNot: req.body.whoCanEatVegOrNot,
        glutenFree: req.body.glutenFree,
        ingridients: req.body.ingridients,
        instructions: req.body.instructions,
        numberOfMeals: req.body.numberOfMeals,
      }
      if (hasNull(recipe_details)){
        throw { status: 409, message: "please send full details" };
      }
      // console.log(await DButils.existsInDB("recipeID", "recipes",recipe_details.recipeID))
      if(await DButils.existsInDB("recipeID", "recipes",recipe_details.recipeID)){
        throw { status: 409, message: "recipe exists in db, please insert another name" };
      }     
      result = await recipes_utils.addRecepie(recipe_details);
      res.status(200).send("The Recipe successfully added to DB");
    }
    catch (error){
      next(error)  
    }
    
  
  });

  function hasNull(target) {
    for (var member in target) {
        if (target[member] == null)
            return true;
    }
    return false;
}

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