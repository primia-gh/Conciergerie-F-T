-- Données de référence. Idempotent (ON CONFLICT DO NOTHING) — rejouable sans dupliquer.
-- Les prix des plans sont des valeurs PLACEHOLDER (illustratives) : aucune décision
-- commerciale n'a été prise. À valider avant tout lancement réel (voir ROADMAP.md, M14).

insert into public.categories (slug, name, icon, active) values
  ('restaurant', 'Restaurant', 'utensils', true),
  ('voyage', 'Voyage', 'plane', true),
  ('hotel', 'Hôtel', 'bed', true),
  ('transport', 'Transport', 'car', true),
  ('evenement', 'Événement', 'calendar', true),
  ('experience', 'Expérience', 'sparkles', true),
  ('bien-etre', 'Bien-être', 'heart', true),
  ('shopping', 'Shopping', 'shopping-bag', true),
  ('lifestyle', 'Lifestyle', 'star', true),
  ('autre', 'Autre', 'more-horizontal', true)
on conflict (slug) do nothing;

insert into public.plans (code, name, price_monthly, request_limit, dedicated_concierge, features) values
  ('free', 'Free', 0, 2, false,
    '{"priority": "normal", "description": "Découverte du service, demandes ponctuelles"}'),
  ('premium', 'Premium', 49, 10, false,
    '{"priority": "high", "description": "Accès prioritaire, volume de demandes plus élevé"}'),
  ('vip', 'VIP', 149, null, true,
    '{"priority": "urgent", "description": "Concierge dédié, demandes illimitées"}'),
  ('private', 'Private', 499, null, true,
    '{"priority": "urgent", "description": "Service sur-mesure, disponibilité étendue, avantages partenaires exclusifs"}')
on conflict (code) do nothing;
