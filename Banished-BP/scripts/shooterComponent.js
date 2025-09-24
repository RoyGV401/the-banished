import { ItemComponentConsumeEvent,world } from "@minecraft/server";
import * as server from "@minecraft/server";
const shakeValues = [
    {
        id:"rev:plasma_rifle",
        shake: 0.2
    },
    {
        id:"rev:brute_plasma_rifle",
        shake: 0.4
    },
    {
        id:"rev:plasma_pistol",
        shake: 0.3
    },
    {
        id:"rev:human_plasma_rifle",
        shake: 0.2
    },
    {
        id:"rev:pulse_carabine",
        shake: 0.1
    }
]

world.beforeEvents.worldInitialize.subscribe(initEvent => {

  initEvent.itemComponentRegistry.registerCustomComponent('rev:gravity_hammer', {
    onUse(arg) {
        const playerData = arg.source;
        playerData.playSound('ajolote.gravity_attack')
        playerData.dimension.spawnEntity('ajolote:gravity_attack',playerData.location)
        playerData.runCommand('camerashake add @s 0.5 0.9 rotational')
        damageItem(playerData,4)
    }
  });

  initEvent.itemComponentRegistry.registerCustomComponent('rev:shooter_component', {
    onUse(arg) {
        const playerData = arg.source;
        const equipment = playerData.getComponent('equippable')
        const item = equipment.getEquipment('Mainhand')
        const tags = item.getTags()
        for (let i = 0; i < tags.length ; i++)
        {
            const currentTag = tags[i];
            const value = "rev:shooter";
            if (currentTag.includes(value))
            {
                const projectileData = currentTag.substring(currentTag.indexOf('=') + 1);
                const projectile = projectileData.split("projectile:'")[1].split("'")[0];
                const power = projectileData.split("power:'")[1].split("'")[0];
                const sound = projectileData.split("sound:'")[1].split("'")[0];
                const damage = parseInt(projectileData.split("damage:'")[1].split("'")[0])

                shootProjectile(world,playerData,projectile,power)
                
                playerData.playSound(sound,{location:playerData.location})
                damageItem(playerData,damage)
            }
           
        }
    }
  });

  initEvent.itemComponentRegistry.registerCustomComponent('rev:ammo_component', {
    onUse(arg) {
        const playerData = arg.source;
        const equipment = playerData.getComponent('equippable');
        const item = equipment.getEquipment('Mainhand');
        const inv = playerData?.getComponent('inventory').container;
        const tags = item.getTags();

        for (let i = 0; i < tags.length; i++) {
            const currentTag = tags[i];
            const value = "rev:ammo";
            if (currentTag.includes(value)) {
                const projectileData = currentTag.substring(currentTag.indexOf('=') + 1);
                const projectile = projectileData.split("projectile:'")[1].split("'")[0];
                const power = projectileData.split("power:'")[1].split("'")[0];
                const sound = projectileData.split("sound:'")[1].split("'")[0];
                const damage = parseInt(projectileData.split("damage:'")[1].split("'")[0]);
                const ammunition = projectileData.split("ammunition:'")[1].split("'")[0];
                const amount = parseInt(projectileData.split("amount:'")[1].split("'")[0]);
                const reloadAmount = parseInt(projectileData.split("reload:'")[1].split("'")[0]);
                const capacity = parseInt(projectileData.split("capacity:'")[1].split("'")[0]);
                const reloadSound = projectileData.split("reload_sound:'")[1].split("'")[0];
                const burst = projectileData.split("burst:'")[1].split("'")[0];
                const burstSpeed = projectileData.split("burst_speed:'")[1].split("'")[0];
                const bloom = projectileData.split("bloom:'")[1].split("'")[0];
                const homing = Number(projectileData?.split("homing:'")[1]?.split("'")[0] ?? 0);
                let target = false;
                if (1)
                {
                    target = playerData?.getEntitiesFromViewDirection()[0]?.entity; 
                }
                let bCount = 1;
                if (item.getDynamicProperty('rev:is_overheated') == true) {
                    return;
                }
                else if (item.getDynamicProperty('rev:shooter') == undefined) {
                    playerData.playSound('random.click');
                    item.setDynamicProperty('rev:shooter', capacity);
                }
                else {
                    const currentCapacity = item.getDynamicProperty('rev:shooter');
                    if (currentCapacity <= 0 || currentCapacity - amount < 0) {
                        item.setDynamicProperty('rev:shooter', 0);
                        playerData.playSound('random.click');
                        if (playerData.runCommand(`testfor @s[hasitem={item=${ammunition},quantity=${reloadAmount}..}]`).successCount > 0) {
                            playerData.runCommand(`clear @s ${ammunition} 0 ${reloadAmount}`);
                            playerData.dimension.playSound(reloadSound, playerData.location);
                            item.setDynamicProperty('rev:shooter', capacity);
                        }
                    }
                    else {
                        const heatingValue = item?.getDynamicProperty('rev:heating_value') ?? 0;
                        const heatingScore = item?.getDynamicProperty('rev:heating_score') ?? 1; // avoid div/0

                        const shakeValue = shakeValues.find(s => s.id === item.typeId) ?? 0.0;

                        let pitchModifier = 1 + ((heatingValue / heatingScore) * 0.4);
                        if (pitchModifier > 1.5) pitchModifier = 1.5; 

                        do {
                            server.system.runTimeout(() => {
                                shootProjectile(world, playerData, projectile, power, bloom, target);
                                playerData.runCommand(`camerashake add @s ${shakeValue.shake + ((heatingValue / heatingScore) * 0.4)} 0.2 positional`)
                                playerData.dimension.playSound(sound, playerData.location, {
                                    pitch: pitchModifier
                                });
                            }, (bCount - 1) * burstSpeed);
                            bCount++;
                        }
                        while (bCount <= burst);

                        item.setDynamicProperty('rev:shooter', (currentCapacity - amount));
                        damageItem(playerData, damage);
                    }
                }
                inv.setItem(playerData.selectedSlotIndex, item);
            }
        }
    }
});


  initEvent.itemComponentRegistry.registerCustomComponent('rev:over_heating', {
    onUse(arg) {
        const playerData = arg.source;
        const equipment = playerData.getComponent('equippable')
        const item = equipment.getEquipment('Mainhand')
        const inv = playerData?.getComponent('inventory').container
        const tags = item.getTags()
        for (let i = 0; i < tags.length ; i++)
        {
            const currentTag = tags[i];
            const value = "rev:heating";
            if (currentTag.includes(value))
            {
                const projectileData = currentTag.substring(currentTag.indexOf('=') + 1);
                const heatingScore = projectileData.split("heating_score:'")[1].split("'")[0];


                let bCount = 1;

                if (item.getDynamicProperty('rev:is_overheated') == undefined) item.setDynamicProperty('rev:is_overheated',false)
                
                if (item.getDynamicProperty('rev:heating_value') == undefined)
                {
                    playerData.playSound('random.click')
                    item.setDynamicProperty('rev:heating_value',0);
                    item.setDynamicProperty('rev:heating_score',heatingScore);
                }
                else if (item.getDynamicProperty('rev:is_overheated') == false)
                {
                    let heatingValue = item.getDynamicProperty('rev:heating_value');
                    if (heatingValue >= heatingScore)
                    {
                        item.setDynamicProperty('rev:is_overheated',true);
                        playerData.sendMessage('Your weapon is overheated')
                    }
                    if (heatingValue>=0 && heatingValue <= heatingScore)
                    {
                        heatingValue++;
                        item.setDynamicProperty('rev:heating_value',heatingValue);
                    }
                    world.sendMessage('Hola '+heatingValue)
                }
                inv.setItem(playerData.selectedSlotIndex, item);
            }
           
        }
    }
  });
});

function damageItem (player,damage){

    const equipment = player.getComponent('equippable');
    const item = equipment.getEquipment('Mainhand');
    const dmg = damage;

        const inv = player?.getComponent('inventory').container
        const durability = item?.getComponent('durability')
        const enchant = item?.getComponent("minecraft:enchantable")?.getEnchantments().map((e) => e.type);
        const unbreaking = enchant?.includes("unbreaking")
        const level = unbreaking?.level

        if (item && durability) {

            if ((durability.maxDurability - durability.damage - dmg) <= 0) {
                inv.setItem(player.selectedSlotIndex);
                player.playSound('random.break')
            }

            if (item && !unbreaking) {
                durability.damage += dmg;
                inv.setItem(player.selectedSlotIndex, item);
            }
            if (item && level == 1) {
                console.warn(Math.round(Math.random(1 / (1 + 1)) * 1))
                durability.damage += Math.round(Math.random(1 / (1 + 1)) * dmg);
                inv.setItem(player.selectedSlotIndex, item);
            }
            if (item && level == 2) {
                console.warn(Math.round(Math.random(1 / (2 + 1)) * 1))
                durability.damage += Math.round(Math.random(1 / (2 + 1)) * dmg);
                inv.setItem(player.selectedSlotIndex, item);
            }
            if (item && level == 3) {
                console.warn(Math.round(Math.random(1 / (3 + 1)) * 1))
                durability.damage += Math.round(Math.random(1 / (4 + 1)) * dmg);
                inv.setItem(player.selectedSlotIndex, item);
            }

           
           
        }
    
}

function shootProjectile(world,playerData,projectile,power,bloom,target)
{
   
    const projectileToShoot = world.getDimension(playerData.dimension.id).spawnEntity(projectile, {
        x: playerData.location.x + (playerData.getViewDirection().x * 1.2),
        y: playerData.location.y + 1.3 + (playerData.getViewDirection().y * 1.2),
        z: playerData.location.z + (playerData.getViewDirection().z * 1.2)
    })
    const pComp = projectileToShoot.getComponent('minecraft:projectile');
    pComp.owner = playerData;
    pComp.shoot({
        x: playerData.getViewDirection().x * power,
        y: playerData.getViewDirection().y * power,
        z: playerData.getViewDirection().z * power
    }, {uncertainty:parseInt(bloom)})

    if (target != false && target != undefined)
    {
        projectileToShoot.setDynamicProperty('rev:homing_target',target.id)
    }

}