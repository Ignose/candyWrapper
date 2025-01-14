import { CombatStrategy } from "grimoire-kolmafia";
import { buy, cliExecute, drink, Effect, hippyStoneBroken, inebrietyLimit, itemAmount, mallPrice, myAdventures, myAscensions, myDaycount, myInebriety, myLevel, myMaxhp, mySign, numericModifier, print, pvpAttacksLeft, restoreHp, restoreMp, retrieveItem, setProperty, toBoolean, use, useFamiliar, useSkill, wait } from "kolmafia";
import { $coinmaster, $effect, $effects, $familiar, $familiars, $item, $items, $location, $skill, get, have, Macro, uneffect } from "libram";
import { args } from "../args";
import { chrono, crimbo, garboWeen, noBarf, postRunQuests } from "./repeatableTasks";
import { Quest } from "./structure";
import { backstageItemsDone, bestFam, doneAdventuring, haveAll, maxBase, pvpCloset, stooperDrunk, totallyDrunk } from "./utils";

let pajamas = false;
let smoke = 0;
const sasqBonus = (0.5 * 30 * 1000) / get("valueOfAdventure");
const ratskinBonus = (0.3 * 40 * 1000) / get("valueOfAdventure");

const checkMelange = () =>
  get("valueOfAdventure") * 45 > mallPrice($item`spice melange`) &&
  !have($item`designer sweatpants`);

export function PostRunQuests(): Quest {
  return {
    name: "Post-Run Aftercore",
      ready: () => myDaycount() === 1 && get("kingLiberated", false),
      completed: () => totallyDrunk() && pajamas,
      tasks: [
        {
          name: "Pull All",
          completed: () => get("lastEmptiedStorage") === myAscensions(),
          do: () => cliExecute("pull all; refresh all"),
        },
        {
          name: "Clear citizen",
          completed: () => !get("_citizenZone", "").includes("castle") && !get("_citizenZone", "").includes("Madness Bakery"),
          do: (): void => {
            uneffect($effect`Citizen of a Zone`);
            cliExecute(`set _citizenZone = ""`);
          },
        },
        {
          name: "Ensure prefs reset",
          completed: () => !get("_folgerInitialConfig", false),
          do: () => cliExecute("set _folgerInitialConfig = false"),
        },
        {
          name: "But dad I don't want to feel lost",
          completed: () => !have($effect`Feeling Lost`),
          do: () => uneffect($effect`Feeling Lost`),
        },
        {
          name: "Sober Up",
          ready:() => args.smol,
          completed: () =>
            (myInebriety() <= 15 ||
            get("_mimeArmyShotglassUsed") ||
            get("_sweatOutSomeBoozeUsed", 0) === 3),
          do: (): void => {
            if (checkMelange()) {
              cliExecute("acquire spice melange; use spice melange");
            }
            while (get("_sweatOutSomeBoozeUsed", 0) < 3) {
              useSkill($skill`Sweat Out Some Booze`);
            }
            if (!get("_sobrieTeaUsed", false)) {
              retrieveItem($item`cuppa Sobrie tea`);
              use($item`cuppa Sobrie tea`);
            }
            use($item`synthetic dog hair pill`);
          },
        },
        {
          name: "PvP Closet Safety 1",
          ready: () => args.pvp && get("autoSatisfyWithCloset") && !args.safepvp,
          completed: () => toBoolean(get("_safetyCloset1")),
          do: () => pvpCloset(1),
        },
        {
          name: "Drink Pre-Tune",
          ready: () =>
            mySign().toLowerCase() === "blender" &&
            myLevel() >= 7 &&
            have($item`mime army shotglass`) &&
            (have($item`astral pilsner`) || have($item`astral six-pack`)),
          completed: () =>
            get("_mimeArmyShotglassUsed") || !have($item`hewn moon-rune spoon`) || get("moonTuned"),
          prepare: () => {
            if (have($item`astral six-pack`)) use($item`astral six-pack`);
          },
          do: () => drink(1, $item`astral pilsner`),
        },
        {
          name: "Moon Spoon",
          completed: () =>
            !have($item`hewn moon-rune spoon`) ||
            get("moonTuned") ||
            mySign().toLowerCase() === "wombat",
          do: () => cliExecute("spoon wombat"),
        },
        {
          name: "Gold Wedding Ring",
          ready: () => !args.cs,
          completed: () =>
            (!have($skill`Comprehensive Cartography`) ||
            myAscensions() === get("lastCartographyBooPeak")),
          choices: { 1430: 3, 606: 4, 610: 1, 1056: 1 },
          do: $location`A-Boo Peak`,
          outfit: { modifier: "initiative 40 min 40 max, -tie" },
        },
        {
          name: "Emergency Drink",
          ready: () => myAdventures() < 25,
          completed: () => get("_mimeArmyShotglassUsed") || !have($item`mime army shotglass`),
          prepare: () => {
            if (have($item`astral six-pack`)) use($item`astral six-pack`);
          },
          do: () => {
            while (myAdventures() < 25) {
              drink(1, $item`astral pilsner`);
            }
          },
        },
        {
          name: "Emergency Drink Part 2",
          ready: () => myAdventures() === 0 && myInebriety() < 11,
          completed: () => myAdventures() > 0 || myInebriety() >= 11,
          prepare: () => {
            if (have($item`astral six-pack`)) use($item`astral six-pack`);
          },
          do: () => {
            while (myAdventures() < 25) {
              useSkill($skill`The Ode to Booze`);
              drink(1, $item`astral pilsner`);
            }
          },
          limit: { tries: 6 },
        },
        {
          name: "Laugh Floor",
          ready: () => !args.cs,
          completed: () =>
            have($skill`Liver of Steel`) ||
            have($item`steel margarita`) ||
            have($item`Azazel's lollipop`) ||
            have($item`observational glasses`),
          effects: () => [
            ...(have($skill`Musk of the Moose`) ? $effects`Musk of the Moose` : []),
            ...(have($skill`Carlweather's Cantata of Confrontation`)
              ? $effects`Carlweather's Cantata of Confrontation`
              : []),
          ],
          prepare: (): void => {
            if (!have($effect`Carlweather's Cantata of Confrontation`)) {
              cliExecute("kmail to Buffy || 10 Cantata of Confrontation");
              wait(15);
              cliExecute("refresh effects");
            }
            $effects`Smooth Movements, The Sonata of Sneakiness, Darkened Photons, Shifted Phase`.forEach(
              (ef: Effect) => cliExecute(`uneffect ${ef}`),
            );
            restoreHp(0.75 * myMaxhp());
            restoreMp(20);
          },
          do: $location`The Laugh Floor`,
          outfit: () => ({
            familiar: bestFam(),
            modifier: `${maxBase()}, 100 combat rate, 3 item, 250 bonus carnivorous potted plant`,
          }),
          combat: new CombatStrategy().macro(
            Macro.trySkill($skill`Curse of Weaksauce`)
              .tryItem($item`train whistle`)
              .tryItem($item`porquoise-handled sixgun`)
              .attack()
              .repeat(),
          ),
          limit: { tries: 15 },
        },
        {
          name: "Infernal Rackets Backstage",
          ready: () => !args.cs,
          completed: () =>
            have($skill`Liver of Steel`) ||
            have($item`steel margarita`) ||
            have($item`Azazel's unicorn`) ||
            backstageItemsDone(),
          effects: () => [
            ...(have($skill`Smooth Movement`) ? $effects`Smooth Movements` : []),
            ...(have($skill`The Sonata of Sneakiness`) ? $effects`The Sonata of Sneakiness` : []),
          ],
          prepare: (): void => {
            if (!have($effect`The Sonata of Sneakiness`)) {
              cliExecute("kmail to Buffy || 10 Sonata of Sneakiness");
              wait(15);
              cliExecute("refresh effects");
            }
            $effects`Musk of the Moose, Carlweather's Cantata of Confrontation, Hooooooooonk!`.forEach(
              (ef: Effect) => cliExecute(`uneffect ${ef}`),
            );
            restoreHp(0.75 * myMaxhp());
            restoreMp(20);
          },
          do: $location`Infernal Rackets Backstage`,
          outfit: () => ({
            familiar: bestFam(),
            modifier: `${maxBase()}, -100 combat rate, 3 item, 250 bonus carnivorous potted plant`,
          }),
          combat: new CombatStrategy().macro(
            Macro.trySkill($skill`Curse of Weaksauce`)
              .tryItem($item`train whistle`)
              .tryItem($item`porquoise-handled sixgun`)
              .attack()
              .repeat(),
          ),
          limit: { tries: 15 },
        },
        {
          name: "Mourn",
          ready: () => have($item`observational glasses`) && !args.cs,
          completed: () =>
            have($skill`Liver of Steel`) ||
            have($item`steel margarita`) ||
            have($item`Azazel's lollipop`),
          outfit: {
            equip: $items`hilarious comedy prop, observational glasses, Victor\, the Insult Comic Hellhound Puppet`,
          },
          do: () => cliExecute("panda comedy insult; panda comedy observe"),
        },
        {
          name: "Sven Golly",
          ready: () => backstageItemsDone() && !args.cs,
          completed: () =>
            have($skill`Liver of Steel`) ||
            have($item`steel margarita`) ||
            have($item`Azazel's unicorn`),
          do: (): void => {
            cliExecute(
              `panda arena Bognort ${$items`giant marshmallow, gin-soaked blotter paper`.find((a) =>
                have(a),
              )}`,
            );
            cliExecute(
              `panda arena Stinkface ${$items`beer-scented teddy bear, gin-soaked blotter paper`.find(
                (a) => have(a),
              )}`,
            );
            cliExecute(
              `panda arena Flargwurm ${$items`booze-soaked cherry, sponge cake`.find((a) =>
                have(a),
              )}`,
            );
            cliExecute(`panda arena Jim ${$items`comfy pillow, sponge cake`.find((a) => have(a))}`);
          },
        },
        {
          name: "Moaning Panda",
          ready: () => haveAll($items`Azazel's lollipop, Azazel's unicorn`) && !args.cs,
          completed: () =>
            have($skill`Liver of Steel`) ||
            have($item`steel margarita`) ||
            have($item`Azazel's tutu`),
          acquire: () =>
            $items`bus pass, imp air`.map((it) => ({
              item: it,
              num: 5,
              price: get("valueOfAdventure"),
            })),
          do: () => cliExecute("panda moan"),
          limit: { tries: 3 },
        },
        {
          name: "Steel Margarita",
          ready: () => haveAll($items`Azazel's tutu, Azazel's lollipop, Azazel's unicorn`),
          completed: () => have($skill`Liver of Steel`) || have($item`steel margarita`),
          do: () => cliExecute("panda temple"),
        },
        {
          name: "Liver of Steel",
          ready: () => have($item`steel margarita`),
          completed: () => have($skill`Liver of Steel`),
          do: () => drink(1, $item`steel margarita`),
        },
        {
          name: "Emergency Drink Part 3",
          ready: () => myAdventures() < 40 && myInebriety() < 11,
          completed: () => myAdventures() > 40 || myInebriety() >= 11,
          prepare: () => {
            if (have($item`astral six-pack`)) use($item`astral six-pack`);
          },
          do: () => {
            while (myAdventures() < 80 && have($item`astral pilsner`)) {
              useSkill($skill`The Ode to Booze`);
              drink(1, $item`astral pilsner`);
            }
          },
          limit: { tries: 6 },
        },
        ...postRunQuests(),
        ...noBarf(),
        ...garboWeen(),
        ...crimbo(),
        ...chrono(),
        {
          name: "Garbo",
          completed: () => myAdventures() === 0 || stooperDrunk(),
          prepare: () => uneffect($effect`Beaten Up`),
          do: () => cliExecute(`${args.garbo}`),
          post: () =>
            $effects`Power Ballad of the Arrowsmith, Stevedave's Shanty of Superiority, The Moxious Madrigal, The Magical Mojomuscular Melody, Aloysius' Antiphon of Aptitude, Ur-Kel's Aria of Annoyance`
              .filter((ef) => have(ef))
              .forEach((ef) => uneffect(ef)),
          clear: "all",
          tracking: "Garbo",
        },
        {
          name: "Turn in FunFunds",
          ready: () => get("_stenchAirportToday") && itemAmount($item`FunFunds™`) >= 20,
          completed: () => have($item`one-day ticket to Dinseylandfill`),
          do: () =>
            buy($coinmaster`The Dinsey Company Store`, 1, $item`one-day ticket to Dinseylandfill`),
          tracking: "Garbo",
        },
        {
          name: "PvP Closet Safety 2",
          ready: () => args.pvp && get("autoSatisfyWithCloset") && !args.safepvp,
          completed: () => toBoolean(get("_safetyCloset2")),
          do: () => pvpCloset(2),
        },
        {
          name: "PvP",
          ready: () => doneAdventuring(),
          completed: () => pvpAttacksLeft() === 0 || !hippyStoneBroken(),
          do: (): void => {
            cliExecute("unequip");
            cliExecute("UberPvPOptimizer");
            cliExecute(`PVP_MAB target=${args.pvpTarget}`);
          },
        },
        {
          name: "Stooper",
          ready: () =>
            myInebriety() === inebrietyLimit() &&
            have($item`tiny stillsuit`) &&
            get("familiarSweat") >= 300,
          completed: () => !have($familiar`Stooper`) || stooperDrunk(),
          do: () => {
            useFamiliar($familiar`Stooper`);
            cliExecute("drink stillsuit distillate");
          },
        },
        {
          name: "Nightcap",
          ready: () => doneAdventuring(),
          completed: () => totallyDrunk(),
          do: () => cliExecute("CONSUME NIGHTCAP"),
        },
        {
          name: "Smoke em if you got em",
          ready: () => get("getawayCampsiteUnlocked"),
          completed: () => !have($item`stick of firewood`),
          do: (): void => {
            while (have($item`stick of firewood`)) {
              setProperty(
                "choiceAdventure1394",
                `1&message=${smoke} Thanks Seraphiii for writing Candywrapper!`,
              );
              use(1, $item`campfire smoke`);
              print(`Smoked ${smoke} firewoods!`);
              smoke = smoke + 1;
            }
          },
        },
        {
          name: "Offhand Remarkable",
          ready: () => have($item`august scepter`),
          completed: () =>
            !have($skill`Aug. 13th: Left/Off Hander's Day!`) ||
            have($effect`Offhand Remarkable`) ||
            get("_aug13Cast", false),
          do: () => useSkill($skill`Aug. 13th: Left/Off Hander's Day!`),
        },
        {
          name: "PvP Closet Safety 3",
          ready: () => args.pvp && get("autoSatisfyWithCloset") && !args.safepvp,
          completed: () => toBoolean(get("_safetyCloset3")),
          do: () => pvpCloset(3),
        },
        {
          name: "Item Cleanup",
          // eslint-disable-next-line libram/verify-constants
          completed: () => get("_cleanupToday", false) || args.itemcleanup === "",
          do: (): void => {
            cliExecute(`${args.itemcleanup}`);
            cliExecute("set _cleanupToday = true");
          },
          clear: "all",
          tracking: "Item Cleanup",
        },
        {
          name: "Pajamas",
          completed: () => have($item`burning cape`),
          acquire: [
            { item: $item`clockwork maid`, price: 7 * get("valueOfAdventure"), optional: true },
            { item: $item`burning cape` },
          ],
          do: (): void => {
            if (have($item`clockwork maid`)) {
              use($item`clockwork maid`);
            }
            pajamas = true;
          },
          outfit: () => ({
            familiar:
              $familiars`Trick-or-Treating Tot, Left-Hand Man, Disembodied Hand, Grey Goose`.find(
                (fam) => have(fam),
              ),
            modifier: `adventures ${sasqBonus} bonus Sasq™ watch, ${ratskinBonus} bonus ratskin pajama pants ${
              args.pvp ? ", 0.3 fites" : ""
            }`,
          }),
        },
        {
          name: "Alert-No Nightcap",
          ready: () => !doneAdventuring(),
          completed: () => stooperDrunk(),
          do: (): void => {
            const targetAdvs = 100 - numericModifier("adventures");
            print("robot completed, but did not overdrink.", "red");
            if (targetAdvs < myAdventures() && targetAdvs > 0)
              print(
                `Rerun with fewer than ${targetAdvs} adventures for smol to handle your diet`,
                "red",
              );
            else print("Something went wrong.", "red");
          },
        },
      ]
  }
}
