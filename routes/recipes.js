var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));


/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try { 
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

router.post('/recipe', async (req,res,next) => {
    
    try{
      let recipe_details = {
        recipeID: req.body.recipeID,
        // username: req.session.username,
        name: req.body.name,
        timeToMake: req.body.timeToMake,
        whoCanEatVegOrNot: req.body.whoCanEatVegOrNot,
        glutenFree: req.body.glutenFree,
        ingridients: req.body.ingridients,
        instructions: req.body.instructions,
        numberOfMeals: req.body.numberOfMeals,
        // dbnumber: 0
      }
      recipe_details.username = "ido"
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