async function getRecipesByName(recipeSearchName, numberOfRecipes) {
    console.log("2")
    console.log(process.env.spooncular_apiKey)
    // return await axios.get(`${api_domain}/complexSearch`, {
    //     params: {
    //         query: recipeSearchName,
    //         apiKey: process.env.spooncular_apiKey
    //     }
    // });
}

router.get("/getRandomRecipes",async (req, res, next) => {
    try {
      random_recipies = await recipes_utils.getRandomRecipies();
      res.status(200,"random recipes generated")
    }
    catch(error){
      next(error)
    }
  })

exports.getRecipesByName = getRecipesByName;
exports.getRandomRecipies = getRandomRecipies;

/**
 * This path return a full details of number of recipes by their name, using the spooncular api
 */
 router.get("/searchRecipe", async (req, res, next) => {
    try {
        console.log("1")
        const recipes = await recipes_utils.getRecipesByName(req.query.recipeSearchName, req.query.numberOfRecipes);
        res.send(recipe);
    } catch (error) {
        next(error);
    }
});