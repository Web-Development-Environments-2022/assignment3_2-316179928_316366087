var express = require("express");
var router = express.Router();
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
    let username = "ehud1"
    try{
      let recipe_details = {
        name: req.body.name,
        timeToMake: req.body.timeToMake,
        whoCanEatVegOrNot: req.body.whoCanEatVegOrNot,
        glutenFree: req.body.glutenFree,
        ingridients: req.body.ingridients,
        instructions: req.body.instructions,
        numberOfMeals: req.body.numberOfMeals
      }
      recipes_from_db = await DButils.existsInDB("name", "recipes",username);
      for (rec in recipes_from_db){
        if (rec.name === recipe_details.name){
          throw { status: 409, message: "recipe exists in db, please insert another name" };
        }
      }
      result = await recipes_utils.addRecepie(recipe_details);
      res.status(200).send("The Recipe successfully added to DB");
    }
    catch (error){
      next(error)  
    }
    
  
  });

module.exports = router;