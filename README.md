# Uncrossy Road

An original endless arcade prototype about launching toy traffic into road lanes while frantic chickens try to cross. The player does not control the chickens; the player spends run money on vehicles and temporary upgrades, then loses everything when the run ends.

## Run

```sh
npm start
```

Open `http://localhost:5173/`.

## Reference

- [Reversy Guide](./guide.html): vehicle prices, chicken rules, cooldowns, stats, and what every run-shop upgrade does.

## Controls

- Click or tap a lane to deploy the selected vehicle.
- Press `1`, `2`, `3`, `4`, or `5` to select car, truck, bus, snow plow, or roadblock car.
- Use up/down arrows or `W/S` to choose a lane, then press `Space` to deploy.
- Use left/right arrows or `A/D` to switch vehicle direction.
- Buy run-shop upgrades with current cash during shop breaks.
- Press `Space` or `Enter` from the menu or game-over screen to restart.
- Mud lanes slow chickens to 25% speed, and run upgrades can make mud even stickier.
- Every 30 seconds of action triggers a 15 second shop break.
- Shop breaks pay 1 interest for every 5 cash you have.
- Shop breaks restore you to at least 5 remaining escapes.
- The final road has a barbed wire trap that pops up to three normal chickens, then can be restocked in the shop.
- Deploying more than 5 vehicles in a row on the same lane locks that lane for 3 seconds.
- The roadblock is now an expensive limited-use vehicle, not a shop upgrade.
- Rare later chickens include the mud-immune Mud Chicken and the 3-minute Jumper that hops over mud.
- At 2:30, a Boss Chicken clears the road, then arrives with 20 health, mud immunity, one-tap immunity, permanent one-eighth speed, and 5 escape damage if it crosses.

## Structure

- `index.html` and `styles.css`: canvas shell, HUD, vehicle selector, run shop, and overlay screens.
- `src/Game.js`: top-level game orchestration, run reset, fail state, and update order.
- `src/config.js`: tuning values, vehicle stats, chicken stats, palette, and upgrade definitions.
- `src/systems/LaneManager.js`: lane positions, directions, and hover lookup.
- `src/systems/Spawner.js`: endless chicken spawning and difficulty ramp.
- `src/systems/ChickenSystem.js`: chicken movement, escapes, hits, splats, and rewards.
- `src/systems/VehicleSystem.js`: deployment, costs, cooldowns, motion, and collision checks.
- `src/systems/Economy.js`: cash, combo timing, payout math, and run stats.
- `src/systems/UpgradeSystem.js`: temporary run upgrades.
- `src/systems/Renderer.js`: original procedural low-poly/voxel-style canvas art.
- `src/systems/Effects.js`: feathers, score popups, lane bursts, and screen shake.
- `src/systems/AudioSystem.js`: original generated Web Audio effects.
- `src/systems/UI.js`: DOM controls and HUD updates.
- `src/systems/Input.js`: pointer and keyboard controls.
