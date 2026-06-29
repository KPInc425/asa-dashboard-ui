export const API_SUITE_NAMES = [
  'asa-control-api',
  'asa-control-grafana',
  'asa-control-prometheus',
  'asa-control-cadvisor',
];

export const SYSTEM_LINKS: Record<string, { label: string; url: string }> = {
  'asa-control-grafana': { label: 'Grafana', url: '/grafana' },
  'asa-control-prometheus': { label: 'Prometheus', url: '/prometheus' },
  'asa-control-cadvisor': { label: 'cAdvisor', url: '/cadvisor' },
  'asa-control-api': { label: 'API Logs', url: '/api/logs/asa-control-api' },
};

export const HIDDEN_KEY = 'ark_dashboard_hidden_containers';

export const MAP_DISPLAY_NAMES: Record<string, string> = {
  'TheIsland_WP': 'The Island',
  'Ragnarok_WP': 'Ragnarok',
  'BobsMissions_WP': 'Club ARK',
  'ScorchedEarth_WP': 'Scorched Earth',
  'Aberration_WP': 'Aberration',
  'Extinction_WP': 'Extinction',
  'Genesis_WP': 'Genesis',
  'Genesis2_WP': 'Genesis Part 2',
  'LostIsland_WP': 'Lost Island',
  'Fjordur_WP': 'Fjordur',
  'CrystalIsles_WP': 'Crystal Isles',
  'Valguero_WP': 'Valguero',
  'Center_WP': 'The Center',
  'Island_WP': 'The Island'
};
