
import * as server from "@minecraft/server"
const world = server.world;

const damageChainValues = [
    {
        id:"rev:plasma_rifle_bullet",
        chain_damage: 16,
        piercing: false,
        piercing_limit: 0,
    },
    {
        id:"rev:brute_plasma_rifle_bullet",
        chain_damage:9,
        piercing: false,
        piercing_limit: 0,
    },
    {
        id:"rev:plasma_pistol_bullet",
        chain_damage:9,
        piercing: false,
        piercing_limit: 0,
    },
    {
        id:"rev:needler_bullet",
        chain_damage:3,
        piercing: false,
        piercing_limit: 0,
    }
]

world.afterEvents.projectileHitEntity.subscribe(data=>{
    const projectile = data.projectile;
    const pComp = projectile.getComponent('minecraft:projectile');

    const damageValues = damageChainValues.find(item => item.id === projectile.typeId);
    if (!damageValues) return
    
    const target = data.getEntityHit().entity;

    const damageValue = damageValues.chain_damage;
    const doPiercing = damageValues.piercing;

    const chainValue = target.getDynamicProperty('rev:chain_damage') ?? 0;
    {
        target.setDynamicProperty('rev:chain_damage',chainValue+damageValue);
        target.applyDamage(chainValue+damageValue, {damagingEntity:pComp.owner,damagingProjectile:projectile});
        target.clearVelocity();
        target.setDynamicProperty('rev:chain_reset',5);
    }

    if (doPiercing == false)
    {
        projectile.remove();
    }

    world.sendMessage('Ouchie '+(chainValue+damageValue))

})


server.system.runInterval(() => {
   const overworld = world.getDimension('minecraft:overworld');
   const entities = overworld.getEntities();
   entities.forEach(e => {
    const reset = e.getDynamicProperty('rev:chain_reset')
        if (reset != undefined)
        {
            if (reset > 0)
                e.setDynamicProperty('rev:chain_reset',reset-1);
            else if (reset <= 0)
            {
                e.setDynamicProperty('rev:chain_damage',0);
            }
        }
        else
        {
            if (e.getDynamicProperty('rev:homing_target') != undefined)
            {
                const target = world.getEntity(e.getDynamicProperty('rev:homing_target'));
                if (target == undefined)
                {
                    e.remove();
                    return;
                }
                const x = target.location.x;
                const y = target.location.y;
                const z = target.location.z;
                e.runCommand(`tp @s ^ ^ ^1 facing ${x} ${y} ${z}`)
            }       
        }
   });
});