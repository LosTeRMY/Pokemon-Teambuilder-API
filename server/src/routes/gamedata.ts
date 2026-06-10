import { Router } from "express";
import abilities from "../../../data/abilities.json";
import items from "../../../data/items.json";
import moves from "../../../data/moves.json";
import pokemons from "../../../data/pokemons.json";
import natures from "../../../data/natures.json";
import formats from "../../../data/formats.json";
import learnsets from "../../../data/learnsets.json";

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