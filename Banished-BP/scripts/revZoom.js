import * as server from "@minecraft/server";
import { EntityInventoryComponent, ItemDurabilityComponent, ItemStack } from "@minecraft/server";


const world = server.world

server.system.runInterval(() => {
   const players = world.getAllPlayers();

   players.forEach((jug) => {
      const equippable = jug.getComponent('equippable');
      const item = equippable.getEquipment('Mainhand');
      const offhand = equippable.getEquipment('Offhand');
      const holdAnim = item?.hasTag('rev:hold_animation') ?? false;
      const hasShield = offhand?.typeId.includes('shield') ?? false;
      const cooldown = item?.getComponent('cooldown') ?? false;
      const holdAnimF = item?.hasTag('rev:hold_animation_f') ?? false;
      const holdTag = jug.hasTag('revHoldAnim') && !(item?.hasTag('rev:hold_c_animation') || item?.hasTag('rev:hold_c_animation_f'));
      let animation = holdAnim ? 'animation.rev.improv.weapon_equipped' : holdAnimF ? 'animation.rev.improv.weapon_equipped.f' : 'animation.rev.improv.weapon_equipped';
      if (hasShield && jug.isSneaking) animation = 'animation.rev.improv.weapon_equipped.f'
      if (cooldown)
      {
         const remain = cooldown.getCooldownTicksRemaining(jug);
         if (remain > 0 && remain < cooldown.cooldownTicks - 5) animation = 'animation.rev.improv.weapon_reloading';
      }
      if ((holdAnim || holdAnimF) && !jug.isSwimming) 
      {
         jug.playAnimation(animation, { nextState: 'a', blendOutTime: 9999 });
         jug.addTag('revHoldAnim');
      }
      else if (holdTag) 
      {
         jug.playAnimation(animation, { nextState: 'a', blendOutTime: 0 });
         jug.removeTag('revHoldAnim');
      }

      if (item == undefined) return;
      const itemId = item.typeId;
      if (jug.isSneaking && (itemId == "rev:hunting_musket" || itemId=="rev:shadow_hunting_musket")) jug.addEffect('slowness', 20, { amplifier: 9, showParticles: false });
      else if ((itemId == "rev:hunting_musket" || itemId=="rev:shadow_hunting_musket")) jug.removeEffect('slowness');
   })
},5);

server.system.runInterval(() => {
   const players = world.getAllPlayers();

   players.forEach((jug) => {
      const equippable = jug.getComponent('equippable');
      const inventory = jug.getComponent(EntityInventoryComponent.componentId).container;


      for (let i = 0; i < inventory.size; i++) {
         const item = inventory.getItem(i);
         if (item?.getDynamicProperty("rev:heating_value") != undefined)
         {
            const heatingValue = item.getDynamicProperty('rev:heating_value');
            const isOverheated = item.getDynamicProperty('rev:is_overheated');
            const newValue = heatingValue - 1;
            const inventory = jug.getComponent(EntityInventoryComponent.componentId).container;
            if (heatingValue > 0)
               {
                  item.setDynamicProperty('rev:heating_value',newValue);
         
                  if (newValue <= 0 && isOverheated)
                  {
                     jug.sendMessage('You weapon is not overheated anymore');
                     item.setDynamicProperty('rev:is_overheated',false);
                  }
               }
               inventory.setItem(i, item);
         }
      };

      
      
   })
},20);