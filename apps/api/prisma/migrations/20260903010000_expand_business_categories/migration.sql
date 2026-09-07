INSERT INTO "ServiceCategory" ("id", "name", "slug", "icon", "active")
VALUES
  (concat('c', substring(md5('rezervo:pet-care') from 1 for 24)), 'Kujdes për kafshë', 'pet-care', 'PawPrint', true),
  (concat('c', substring(md5('rezervo:legal-notary') from 1 for 24)), 'Avokatë & noterë', 'legal-notary', 'Scale', true),
  (concat('c', substring(md5('rezervo:rentals') from 1 for 24)), 'Qira pajisjesh & automjetesh', 'rentals', 'KeyRound', true),
  (concat('c', substring(md5('rezervo:tourism-activities') from 1 for 24)), 'Ture & aktivitete', 'tourism-activities', 'Compass', true),
  (concat('c', substring(md5('rezervo:coworking') from 1 for 24)), 'Coworking & zyra', 'coworking', 'MonitorCog', true),
  (concat('c', substring(md5('rezervo:electronics-repair') from 1 for 24)), 'Servis elektronik', 'electronics-repair', 'Wrench', true),
  (concat('c', substring(md5('rezervo:child-care') from 1 for 24)), 'Kujdes & aktivitete për fëmijë', 'child-care', 'Baby', true)
ON CONFLICT ("slug") DO UPDATE
SET "name" = EXCLUDED."name", "icon" = EXCLUDED."icon", "active" = true;
