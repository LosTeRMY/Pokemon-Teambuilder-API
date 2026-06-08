import { Router } from "express";
import abilities from "../data/json/abilities.json";
import items from "../data/json/items.json";
import moves from "../data/json/moves.json";
import pokemons from "../data/json/pokemons.json";
import natures from "../data/json/natures.json";
import formats from "../data/json/formats.json";
import learnsets from "../data/json/learnsets.json";

const router = Router();

router.get("/abilities", (req, res) => {
  res.json(abilities);
});

router.get("/items", (req, res) => {
  res.json(items);
}); 

router.get("/moves", (req, res) => {
  res.json(moves);
});

router.get("/pokemons", (req, res) => {
  res.json(pokemons);
});

router.get("/natures", (req, res) => {
  res.json(natures);
});

router.get("/formats", (req, res) => {
  res.json(formats);
});

router.get("/learnsets", (req, res) => {
  res.json(learnsets);
});

export default router;