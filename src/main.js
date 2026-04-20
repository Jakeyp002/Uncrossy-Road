import { Game } from "./Game.js";

const canvas = document.querySelector("#game");
const game = new Game(canvas);
game.start();
