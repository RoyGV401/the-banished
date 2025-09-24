import {
    ItemStack
 } from "@minecraft/server";
 
 export function damageItem(player, damage) {
    const fakeSwing = Math.floor(Math.random() * 100)
    const equipment = player.getComponent('equippable');
    const item = equipment.getEquipment('Mainhand');
    const inventory = player.getComponent('inventory').container
    const durability = item.getComponent('durability')
    const enchant = item?.getComponent("minecraft:enchantable");
    const level = enchant?.getEnchantment("unbreaking")?.level ?? 0;
    if (item && durability) {
       item.setDynamicProperty('rev:swing', fakeSwing)
 
       if ((durability.maxDurability - durability.damage - damage) <= 0) {
          inventory.setItem(player.selectedSlotIndex);
          player.playSound('random.break')
       }
 
       if (item && level == 0) {
          durability.damage += damage;
          inventory.setItem(player.selectedSlotIndex, item);
       }
 
       if (item && level > 0) {
          const rng = Math.floor(Math.random() * 5)
          durability.damage += rng <= level ? 0 : 1;
          inventory.setItem(player.selectedSlotIndex, item);
       }
    }
 
 }
 
 export function shootProjectile(world, playerData, projectile, power, multishotBonus, isPiercing, potionEffect) {
    let projectileToShoot = playerData.dimension.spawnEntity(projectile, {
       x: playerData.location.x + (playerData.getViewDirection().x * 2),
       y: playerData.location.y + 1.5 + (playerData.getViewDirection().y * 2),
       z: playerData.location.z + (playerData.getViewDirection().z * 2)
    })
    let projectileComp = projectileToShoot.getComponent("minecraft:projectile");
    projectileComp.owner = playerData;
    
    projectileToShoot.setDynamicProperty('rev:piercing', 0)
    projectileToShoot.setDynamicProperty('rev:arrow_counter', 0)
    projectileToShoot.setDynamicProperty('rev:potion_effect', potionEffect[0]);
    projectileToShoot.setDynamicProperty('rev:potion_duration', potionEffect[1]);
    projectileToShoot.setDynamicProperty('rev:potion_amplifier', potionEffect[2]);
 
    const viewX = playerData.getViewDirection().x;
    const viewZ = playerData.getViewDirection().z;
    if (!isPiercing) {
 
       if ((viewX > 0 && viewZ > 0) || (viewX < 0 && viewZ < 0)) {
          projectileComp.shoot({
             x: (playerData.getViewDirection().x - multishotBonus) * power,
             y: playerData.getViewDirection().y * power,
             z: (playerData.getViewDirection().z + multishotBonus) * power
          });
       } else {
          projectileComp.shoot({
             x: (playerData.getViewDirection().x + multishotBonus) * power,
             y: playerData.getViewDirection().y * power,
             z: (playerData.getViewDirection().z + multishotBonus) * power
          });
       }
    } else {
       projectileToShoot.triggerEvent('rev:piercing');
       projectileToShoot.setDynamicProperty('rev:piercing', isPiercing)
       projectileToShoot.setDynamicProperty('rev:arrow_counter', 1)
       projectileComp.shoot({
          x: (playerData.getViewDirection().x) * power,
          y: playerData.getViewDirection().y * power,
          z: (playerData.getViewDirection().z) * power
       });
    }
    return projectileToShoot;
 }
 
 export function enchantRemover(playerData, heldItem, enchantment) {
    const inventory = playerData?.getComponent('inventory').container
    if (heldItem === undefined) return;
    if (heldItem.getComponent('enchantable') === undefined) return;
    if (heldItem.getComponent("enchantable").hasEnchantment(enchantment)) {
       heldItem.getComponent("enchantable").removeEnchantment(enchantment);
       inventory.setItem(playerData.selectedSlotIndex, heldItem);
       playerData.sendMessage("§eThis item cannot be enchanted with " + (formatString(enchantment)))
    }
 
 }
 
 
 export function formatString(input) {
    let parts = input.split(":");
    if (parts.length > 1) {
       input = parts[1];
    }
    input = input.replace(/_/g, " ");
    let words = input.split(" ").filter(word => !/\d/.test(word));
    input = words.map(word => {
       return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(" ");
    return input;
 }
 
 export function itemReplace(playerData, heldItem, targetItem) {
    try {
       if (heldItem.typeId == targetItem) return;
       const inventory = playerData.getComponent('inventory').container;
       const enchantArray = heldItem.getComponent("enchantable").getEnchantments();
       const itemReplacement = new ItemStack(targetItem)
       const dynamicProperties = heldItem.getDynamicPropertyIds()
       itemReplacement.getComponent("enchantable").addEnchantments(enchantArray);
       itemReplacement.getComponent('durability').damage = heldItem.getComponent("durability").damage;
       itemReplacement.nameTag = heldItem.nameTag
       itemReplacement.setLore(heldItem.getLore())
       for (let i = 0; i < dynamicProperties.length; i++) {
          const currentPropertyValue = heldItem.getDynamicProperty(dynamicProperties[i])
          itemReplacement.setDynamicProperty(dynamicProperties[i], currentPropertyValue)
       }
       inventory.setItem(playerData.selectedSlotIndex, itemReplacement)
    } catch (ex) {}
 }