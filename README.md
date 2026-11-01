# Deadlands 5e RU v0.1.0 — experimental prototype

Target: Foundry VTT v13, dnd5e 5.1.10. This is an unofficial fan-made prototype, not affiliated with Pinnacle Entertainment or Wizards of the Coast. No proprietary Deadlands book text, artwork or D&D icon files are bundled.

## Installation
1. Close Foundry, or return to Setup.
2. Unzip the archive into `FoundryVTT/Data/modules/` so that the directory is `modules/deadlands-5e-ru/` and contains `module.json`.
3. Start Foundry, enter a world using dnd5e 5.1.10, open **Manage Modules**, enable **Deadlands 5e RU**.
4. Open a character sheet. Look for the **🤠 Вестерн** button near the window header. If the button is not shown due to a custom sheet, open the browser console (F12) and run `game.deadlands5e.openPanel(canvas.tokens.controlled[0]?.actor ?? game.actors.contents.find(a => a.type === "character"))` after selecting a token or creating a character.

## Implemented
- Per-character persistent flags: revolver rounds (6 capacity), reserve ammunition (24), six wound counters, white/blue/red chips.
- Fire: spend one round, roll d20 + DEX modifier + proficiency bonus, publish chat result.
- Reload one or all rounds from reserve.
- d20 ability check dialog with optional proficiency and additional modifier.
- Generic d20 fate roll.

## Limitations / TODO
- Fire uses proficiency unconditionally, regardless of actual firearm proficiency; this is intentionally labelled conditional in UI. It does not roll weapon damage, target AC, or apply wounds.
- The cylinder is an ammo counter, not a chamber-by-chamber simulation. No turn/action economy integration yet.
- Wounds and chips are trackers only; they do not modify actor statistics.
- No custom actor sheet, magic, poker, duel engine, compendiums, or item migration yet.
- UI injection relies on the actor sheet render hook; custom sheets may need another integration path.
- Module has not been runtime-tested in a live Foundry installation. Test in a backup world.

## Developer notes
Core state is stored at `flags.deadlands-5e-ru.state`. Use `game.deadlands5e.getState(actor)` to inspect it. To extend, add a weapon-to-item binding, validated proficiency, and an actual attack workflow before introducing damage automation.
