# Asset manifest

Every image on the site is generated, none are stock. Model `gpt_image_2_5`
(Higgsfield), shared prompt slots for SETTING, LIGHTING and GRADE across the
whole set so the grade stays consistent; only SUBJECT, CAMERA and COMPOSITION
vary per asset.

Shared grade: high contrast cinematic teal and amber, deep crushed blacks,
fine 35mm film grain. Shared render language: cinematic 3D render in Minecraft
voxel style, cubic blocks, square heads and rectangular limbs.

Sampled accent colours, taken from the finished plates and used as the CSS
tokens: warm `#d2843e` and cool `#22aad6`.

| File | Source prompt subject | Quality | Verdict |
|---|---|---|---|
| hero-city.webp | Downtown voxel avenue, night after rain, negative space upper centre | high / 2k | accepted |
| char-police.webp | Police officer, full body, transparent background | high / 2k | accepted |
| char-soldier.webp | Soldier, full body, transparent background | high / 2k | accepted |
| char-criminal.webp | Hooded street criminal, full body, transparent background | high / 2k | accepted |
| war-wide.webp | Wide battlefield, distant explosion centred on the horizon | high / 2k | accepted, dive start frame |
| war-close.webp | Same fight from inside, fireball filling frame | high / 2k | accepted, dive end frame |
| role-police.webp | Officer directing traffic beside a patrol car | high / 1k | accepted |
| role-medic.webp | Paramedic with an open kit, ambulance behind | high / 1k | accepted |
| role-military.webp | Soldier behind sandbags, armour in the smoke | high / 1k | accepted |
| role-business.webp | Businessman in front of an office tower | high / 1k | accepted |
| role-mechanic.webp | Mechanic with a wrench, car on a lift | high / 1k | accepted |
| role-criminal.webp | Criminal against a graffiti wall in an alley | high / 1k | accepted |
| role-trucker.webp | Semi truck dominant, trucker small for scale | high / 1k | **regenerated once** |
| role-farmer.webp | Farmer in a wheat field, city skyline behind | high / 1k | accepted |
| feat-events.webp | Arena crowd, stage, fireworks | high / 2k | accepted |
| feat-systems.webp | Showroom garage, row of custom cars | high / 2k | accepted |
| feat-voice.webp | Six players talking on a street corner | high / 2k | accepted |
| cta-lineup.webp | Rooftop team lineup, skyline behind, centre negative space | high / 2k | accepted |
| og-cover.jpg | Crop of cta-lineup at 1200x630 | derived | accepted |

## Rejections

`role-trucker` first pass produced a figure on a wet street with no truck
visible, so it read as a second police card. Regenerated with the truck made
dominant and the character shrunk to a scale reference. Second pass accepted.

## Credits

14 generations in total, 13 accepted on the first pass plus one regeneration.
Balance went from 171.5 to 123.5, so **48 credits** were spent.

## Post processing

Done locally with Pillow, no external service:

- Character cutouts cropped to their alpha bounding box, then resized to 820px
  wide and saved as WebP with alpha.
- Wide plates saved at 2200px and 1100px so `srcset` can serve a mobile variant.
- Role cards saved at 680px, which is twice their rendered width.
- Total shipped image weight: ~3.4MB across 25 files, of which the first
  viewport loads only the hero plate and three cutouts.
