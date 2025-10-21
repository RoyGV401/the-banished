import * as server from "@minecraft/server"
import {
   ARROW_EFFECTS
} from "./vgConstants"
import {
   damageItem,
   shootProjectile,
   itemReplace,
   enchantRemover
} from "./vgFunctions"
const world = server.world

world.afterEvents.playerPlaceBlock.subscribe(data => {
   if (data.block.typeId == "rev:firearm_forger") {
      const dimension = data.block.dimension;
      const loc = data.block.location;
      dimension.spawnEntity('rev:firearm_forger', {
         x: loc.x + 0.5,
         y: loc.y,
         z: loc.z + 0.5
      })
   } else return;
})

world.beforeEvents.playerBreakBlock.subscribe(data => {
   const dimension = data.block.dimension;
   const playerLocation = data.block.location;
   if (data.block.typeId == "rev:firearm_forger") {
      const entitiesToDelete = dimension.getEntities({
         location: playerLocation,
         type: "rev:firearm_forger",
         minDistance: 0,
         maxDistance: 1
      })
      for (let i = 0; i < entitiesToDelete.length; i++) {
         const currentEntity = entitiesToDelete[i]
         if (currentEntity.typeId == "rev:firearm_forger") {
            server.system.run(() => {
               currentEntity.remove()
            });

         }
      }
   }
})

world.afterEvents.projectileHitEntity.subscribe(data => {
   if (data.projectile.typeId == "rev:fake_arrow") {
      const entityHit = data.getEntityHit().entity;
      const arrow = data.projectile.getDynamicProperty('rev:arrow_counter')
      const piercing = data.projectile.getDynamicProperty('rev:piercing')
      const effect = data.projectile.getDynamicProperty('rev:potion_effect')
      data.projectile.setDynamicProperty('rev:arrow_counter', arrow + 1)
      if (effect != null) {
         entityHit.addEffect(effect, data.projectile.getDynamicProperty('rev:potion_duration') * 20)
      }
      if (arrow == 0)
    {
        data.projectile.remove();
        return;
    } 
      if (arrow == piercing) {
         data.projectile.remove()
      }
   } else return;
})

//DESTROY ARROWS WHEN HIT BLOCK
world.afterEvents.projectileHitBlock.subscribe(data => {
    if (data.projectile.typeId == "rev:fake_arrow") 
    {
        server.system.runTimeout(() => {
            data.projectile.remove();
        },2)
    } else return;
 })


world.afterEvents.itemUse.subscribe(data => {
   world.sendMessage('Es: '+data.itemStack.typeId)
   if (data.itemStack.typeId.includes("rev:repeater_crossbow")) {
      let power = 5;
      const enchant = data.itemStack?.getComponent("minecraft:enchantable");
      const levelMultishot = enchant?.getEnchantment("multishot")?.level ?? 0;
      const levelPiercing = enchant?.getEnchantment("piercing")?.level ?? 0;
      const levelCharge = enchant?.getEnchantment("quick_charge")?.level ?? 0;
      const cooldown = data.itemStack?.getComponent("minecraft:cooldown");
      let potionEffect = null;
      let potionDuration = 0;
      let potionAmplifier = 0;
      let cooldownRemaining = cooldown?.getCooldownTicksRemaining(data.source)
      if (!cooldownRemaining) cooldown.startCooldown(data.source)
      cooldownRemaining = cooldown?.getCooldownTicksRemaining(data.source)

      if (data.source.runCommand('testfor @s[hasitem={item=minecraft:arrow}]').successCount > 0) {
         if (data.source.runCommand('testfor @s[hasitem={item=minecraft:arrow,location=slot.weapon.offhand}]').successCount > 0) {
            for (let i = 6; i < 48; i++) {
               if (data.source.runCommand('testfor @a[hasitem={item=minecraft:arrow,location=slot.weapon.offhand,data=' + i + '}]').successCount > 0) {
                  data.source.runCommand(`clear @s arrow ${i} 1`);
                  potionEffect = ARROW_EFFECTS[i][0];
                  potionDuration = ARROW_EFFECTS[i][1];
                  potionAmplifier = ARROW_EFFECTS[i][2];
                  break;
               }
            }
         } else {
            for (let i = 6; i < 48; i++) {
               if (data.source.runCommand('testfor @a[hasitem={item=minecraft:arrow,data=' + i + '}]').successCount > 0) {
                  data.source.runCommand(`clear @s arrow ${i} 1`);
                  potionEffect = ARROW_EFFECTS[i][0];
                  potionDuration = ARROW_EFFECTS[i][1];
                  potionAmplifier = ARROW_EFFECTS[i][2];
                  break;
               }
            }
         }
         if (potionEffect == null) data.source.runCommand('clear @s arrow 0 1');
         if ((cooldown.cooldownTicks - 1 <= cooldownRemaining)) {
            if (enchant && levelMultishot > 0) {
               shootProjectile(world, data.source, 'rev:fake_arrow', power, 0, false, [potionEffect, potionDuration, potionAmplifier])
               shootProjectile(world, data.source, 'rev:fake_arrow', power, 0.1, false, [potionEffect, potionDuration, potionAmplifier])
               shootProjectile(world, data.source, 'rev:fake_arrow', power, -0.1, false, [potionEffect, potionDuration, potionAmplifier])
            } else if (enchant && levelPiercing > 0) {
               shootProjectile(world, data.source, 'rev:fake_arrow', power, 0.1, levelPiercing, [potionEffect, potionDuration, potionAmplifier])
            } else shootProjectile(world, data.source, 'rev:fake_arrow', power, 0, false, [potionEffect, potionDuration, potionAmplifier])

            damageItem(data.source, 1)
            data.source.playSound('crossbow.shoot', {
               location: data.source.location
            })


         }
         switch (levelCharge) {
            case 1:
               itemReplace(data.source, data.itemStack, 'rev:repeater_crossbow_c_1')
               break;
            case 2:
               itemReplace(data.source, data.itemStack, 'rev:repeater_crossbow_c_2')
               break;
            case 3:
               itemReplace(data.source, data.itemStack, 'rev:repeater_crossbow_c_3')
               break;
         }
      }


   } 

   else return;
})