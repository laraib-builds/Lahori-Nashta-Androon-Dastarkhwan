import { FamilyMemberId } from '../types/game';

export const GAME_ASSETS = {
  backdrop: '/src/assets/images/androon_morning_backdrop_1795357589977.jpg',
  portraits: {
    Dadi: '/src/assets/images/portrait_dadi_comic_1795357588855.jpg',
    Abbu: '/src/assets/images/portrait_abbu_comic_1795357589970.jpg',
    Ammi: '/src/assets/images/portrait_ammi_comic_1795357590071.jpg',
    Chotu: '/src/assets/images/portrait_chotu_comic_1795357589551.jpg',
  } as Record<FamilyMemberId, string>,
};
