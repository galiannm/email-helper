-- Directors
INSERT INTO "Director" ("id", "name", "email", "schoolName", "signatureEn", "signatureFr", "updatedAt") VALUES
  ('SATHORN', 'Bérangère Cruz', 'berangerecruz@acacia-education.com', 'Acacia Bangkok - Sathorn',
   'Best regards,' || char(10) || char(10) || 'Bérangère Cruz' || char(10) || 'Director' || char(10) || 'Acacia Bangkok - Sathorn',
   'Bien cordialement,' || char(10) || char(10) || 'Bérangère Cruz' || char(10) || 'Directrice' || char(10) || 'Acacia Bangkok - Sathorn',
   CURRENT_TIMESTAMP),
  ('SUKHUMVIT', 'Rachna', 'Rachna@acacia-education.com', 'Acacia Bangkok - Sukhumvit',
   'Best regards,' || char(10) || char(10) || 'Rachna' || char(10) || 'Director' || char(10) || 'Acacia Bangkok - Sukhumvit',
   'Bien cordialement,' || char(10) || char(10) || 'Rachna' || char(10) || 'Directrice' || char(10) || 'Acacia Bangkok - Sukhumvit',
   CURRENT_TIMESTAMP),
  ('HANOI_TAYHO', 'Amandine Dossche', 'amandinedossche@acacia-education.com', 'Acacia Hanoi - Tay Ho',
   'Best regards,' || char(10) || char(10) || 'Amandine Dossche' || char(10) || 'Director' || char(10) || 'Acacia Hanoi - Tay Ho',
   'Bien cordialement,' || char(10) || char(10) || 'Amandine Dossche' || char(10) || 'Directrice' || char(10) || 'Acacia Hanoi - Tay Ho',
   CURRENT_TIMESTAMP),
  ('HANOI_LONGBIEN', 'Amandine Dossche', 'amandinedossche@acacia-education.com', 'Acacia Hanoi - Long Bien',
   'Best regards,' || char(10) || char(10) || 'Amandine Dossche' || char(10) || 'Director' || char(10) || 'Acacia Hanoi - Long Bien',
   'Bien cordialement,' || char(10) || char(10) || 'Amandine Dossche' || char(10) || 'Directrice' || char(10) || 'Acacia Hanoi - Long Bien',
   CURRENT_TIMESTAMP),
  ('PHNOM_PENH', 'Anne-Sophie Grasset', 'annesophiegrasset@acacia-education.com', 'Acacia Phnom Penh',
   NULL, NULL, CURRENT_TIMESTAMP),
  ('DEFAULT', 'Acacia Team', 'contact@acacia-education.com', 'Acacia International School',
   'Best regards,' || char(10) || 'Acacia International School Team',
   'Bien cordialement,' || char(10) || 'L''équipe Acacia International School',
   CURRENT_TIMESTAMP);

-- Sections
INSERT INTO "Section" ("code", "nameEn", "ageRangeEn", "nameFr", "ageRangeFr", "updatedAt") VALUES
  ('EXPLORERS',    'Explorers',    '18 months to 3 years',      'Explorateurs',   '18 mois à 3 ans',                  CURRENT_TIMESTAMP),
  ('ADVENTURERS',  'Adventurers',  '3 to 4 years (K1)',         'Aventuriers',    '3 à 4 ans (Petite Section)',        CURRENT_TIMESTAMP),
  ('TRAVELERS',    'Travelers',    '4 to 5 years (Reception)',  'Voyageurs',      '4 à 5 ans (Moyenne Section)',       CURRENT_TIMESTAMP),
  ('GLOBETROTTERS','Globetrotters','5 to 6 years (Year 1)',     'Globe-trotteurs','5 à 6 ans (Grande Section)',        CURRENT_TIMESTAMP);

-- Templates: Bangkok
INSERT INTO "Template" ("id", "campus", "part", "textEn", "textFr", "updatedAt") VALUES
  ('tmpl-bkk-greeting', 'bangkok', 'greeting',
   'Dear {parent_name},' || char(10) || char(10) || 'Thank you for your message and the interest that you have in our nursery school.',
   'Bonjour {parent_name},' || char(10) || char(10) || 'Je vous remercie de votre message et de l''intérêt que vous portez à notre établissement.',
   CURRENT_TIMESTAMP),

  ('tmpl-bkk-childWelcome', 'bangkok', 'childWelcome',
   'We would be happy to welcome {child_name} at Acacia in the {section_name}.',
   'Nous serions ravis d''accueillir {child_name} à Acacia dans la section {section_name}.',
   CURRENT_TIMESTAMP),

  ('tmpl-bkk-programDescription', 'bangkok', 'programDescription',
   'Like the other sections, the children are immersed alternately in French and in English. They have an English-speaking teacher and a French-speaking teacher. The bilingual program that we have put in place takes into account in a balanced way the prerogatives of both the French and English systems.',
   'Comme pour les autres sections, les enfants sont immergés, en alternance, en français et en anglais. Ils ont deux institutrices, une anglophone et une francophone. Le programme bilingue que nous proposons prend en compte de manière équilibrée les prérogatives des systèmes français et anglais.',
   CURRENT_TIMESTAMP),

  ('tmpl-bkk-internationalOption', 'bangkok', 'internationalOption',
   'We also have an International curriculum, full in English. Please let me know if you are more interested in this curriculum.',
   'Nous proposons également un curriculum International, entièrement en anglais. N''hésitez pas à me faire savoir si vous êtes plus intéressé par ce programme.',
   CURRENT_TIMESTAMP),

  ('tmpl-bkk-locationChoice', 'bangkok', 'locationChoice',
   'We have two centres: one centre in Yen Akat Soi 2 (Sathorn Area) and one centre in Ekkamai Soi 6 (Sukhumvit Area). Which centre would you be interested in for {child_name}?',
   'Nous avons deux centres : un centre à Yen Akat Soi 2 (quartier de Sathorn) et un centre à Ekkamai Soi 6 (quartier de Sukhumvit). Quel centre vous intéresserait pour {child_name} ?',
   CURRENT_TIMESTAMP),

  ('tmpl-bkk-sathornDescription', 'bangkok', 'sathornDescription',
   'Our Sathorn campus is located in the historic French Quarter, featuring a beautiful permaculture garden where children can connect with nature.',
   'Notre campus de Sathorn est situé dans le quartier français historique, avec un magnifique jardin de permaculture où les enfants peuvent se connecter avec la nature.',
   CURRENT_TIMESTAMP),

  ('tmpl-bkk-sukhumvitDescription', 'bangkok', 'sukhumvitDescription',
   'Our Sukhumvit campus offers modern facilities with advanced air filtration and complimentary Tuk Tuk service from BTS Ekkamai.',
   'Notre campus de Sukhumvit propose des installations modernes avec un système de filtration d''air avancé et un service de Tuk Tuk gratuit depuis le BTS Ekkamai.',
   CURRENT_TIMESTAMP),

  ('tmpl-bkk-visitOffer', 'bangkok', 'visitOffer',
   'I would be available to show you around our {campus_name} campus on {date_time_1} or {date_time_2}. Please let me know if one of these days is suitable for you.',
   'Je serais disponible pour vous faire visiter notre campus de {campus_name} le {date_time_1} ou le {date_time_2}. Merci de me faire savoir si l''une de ces dates vous convient.',
   CURRENT_TIMESTAMP),

  ('tmpl-bkk-relocatingOption', 'bangkok', 'relocatingOption',
   'Since you''re relocating to Bangkok, we could also arrange a WhatsApp meeting if you prefer.',
   'Comme vous déménagez à Bangkok, nous pourrions également organiser une rencontre WhatsApp si vous préférez.',
   CURRENT_TIMESTAMP),

  ('tmpl-bkk-attachments', 'bangkok', 'attachments',
   'Please find attached documents containing more information about our bilingual nursery school, and a registration form.',
   'En attendant, je me permets de joindre à ce mail un dossier regroupant diverses informations concernant notre crèche et école bilingue ainsi qu''un formulaire d''inscription.',
   CURRENT_TIMESTAMP),

  ('tmpl-bkk-closing', 'bangkok', 'closing',
   'I wish you a good day and I am looking forward to hearing from you.',
   'Je vous souhaite une bonne journée et j''ai hâte de vous rencontrer.',
   CURRENT_TIMESTAMP);

-- Templates: Hanoi
INSERT INTO "Template" ("id", "campus", "part", "textEn", "textFr", "updatedAt") VALUES
  ('tmpl-han-greeting', 'hanoi', 'greeting',
   'Dear {parent_name},' || char(10) || char(10) || 'Thank you for reaching out and for your interest in Acacia! We would be delighted to welcome {child_name} to our preschool.',
   'Bonjour {parent_name},' || char(10) || char(10) || 'Merci pour votre message et pour l''intérêt que vous portez à notre école maternelle Acacia.',
   CURRENT_TIMESTAMP),

  ('tmpl-han-childWelcome', 'hanoi', 'childWelcome',
   'At {age}, {child_name} would join our {section_name} class.',
   'À {age}, {child_name} intégrerait notre section {section_name}.',
   CURRENT_TIMESTAMP),

  ('tmpl-han-programDescription', 'hanoi', 'programDescription',
   'Our bilingual program follows a "one day, one language" approach: for example, if Monday is a French day, Tuesday will be in English. This method allows children to develop natural bilingualism through complete immersion. Each class has two native-speaking teachers, one for French and one for English. Additionally, children receive one hour of Vietnamese per week to connect with local culture.',
   'Notre programme bilingue suit une approche "un jour, une langue" : par exemple, si le lundi est une journée française, le mardi sera en anglais. Cette méthode permet aux enfants de développer un bilinguisme naturel par immersion complète. Chaque classe a deux enseignants natifs, un pour le français et un pour l''anglais. De plus, les enfants bénéficient d''une heure de vietnamien par semaine pour se connecter à la culture locale.',
   CURRENT_TIMESTAMP),

  ('tmpl-han-visitOffer', 'hanoi', 'visitOffer',
   'To give you a better sense of our school and how we work with young children, I would love to invite you for a visit on {date_time_1} or {date_time_2}. Alternatively, we could arrange a virtual tour via Zoom if that''s more convenient for you.',
   'Pour vous donner une meilleure idée de notre école et de notre façon de travailler avec les jeunes enfants, je serais ravi de vous inviter pour une visite le {date_time_1} ou le {date_time_2}. Alternativement, nous pourrions organiser une visite virtuelle via Zoom si cela vous convient mieux.',
   CURRENT_TIMESTAMP),

  ('tmpl-han-attachments', 'hanoi', 'attachments',
   'Please find attached our information pack, including our school brochure, fee structure, and registration documents.',
   'Vous trouverez en pièces jointes notre dossier d''information, comprenant notre brochure scolaire, notre grille tarifaire et les documents d''inscription.',
   CURRENT_TIMESTAMP),

  ('tmpl-han-closing', 'hanoi', 'closing',
   'Looking forward to meeting you!',
   'Dans l''attente de vous rencontrer !',
   CURRENT_TIMESTAMP);

-- Templates: Phnom Penh
INSERT INTO "Template" ("id", "campus", "part", "textEn", "textFr", "updatedAt") VALUES
  ('tmpl-pp-greeting', 'phnomPenh', 'greeting',
   'Dear {parent_name},' || char(10) || char(10) || 'Thank you for your message and for your interest in enrolling {child_name} at Acacia Phnom Penh.',
   'Bonjour {parent_name},' || char(10) || char(10) || 'Je vous remercie de votre message et de votre intérêt d''inscrire {child_name} à Acacia Phnom Penh.',
   CURRENT_TIMESTAMP),

  ('tmpl-pp-childWelcome', 'phnomPenh', 'childWelcome',
   'At {age}, {child_name} would join the {section_name}. Like all our sections, this program offers alternating immersion in French and English, with two teachers: one French-speaking and one English-speaking.',
   'À {age}, {child_name} intégrerait la section {section_name}. Comme pour toutes nos sections, ce programme offre une immersion en alternance en français et en anglais, avec deux enseignants : un francophone et un anglophone.',
   CURRENT_TIMESTAMP),

  ('tmpl-pp-aefeHighlight', 'phnomPenh', 'aefeHighlight',
   'I would like to highlight that our kindergarten section is accredited by the AEFE (Agency for French Education Abroad) since June 2024. This recognition ensures the quality of our bilingual teaching and provides direct access to all AEFE French schools worldwide - a significant advantage for international families.',
   'Je tiens à souligner que notre section maternelle est homologuée par l''AEFE (Agence pour l''enseignement français à l''étranger) depuis juin 2024. Cette reconnaissance garantit la qualité de notre enseignement bilingue et offre un accès direct à toutes les écoles françaises AEFE dans le monde - un avantage significatif pour les familles internationales.',
   CURRENT_TIMESTAMP),

  ('tmpl-pp-under18Months', 'phnomPenh', 'under18Months',
   'While we typically welcome children from 18 months, we can sometimes accommodate children as early as 16-17 months if they can walk and seem developmentally ready. We could discuss {child_name}''s readiness during a visit.',
   'Bien que nous accueillions généralement les enfants à partir de 18 mois, nous pouvons parfois accepter des enfants dès 16-17 mois s''ils marchent et semblent prêts sur le plan développemental. Nous pourrions discuter de la préparation de {child_name} lors d''une visite.',
   CURRENT_TIMESTAMP),

  ('tmpl-pp-visitOffer', 'phnomPenh', 'visitOffer',
   'I would be happy to show you around our school. I have availability on:' || char(10) || char(10) || '- {date_time_1}' || char(10) || '- {date_time_2}' || char(10) || '- {date_time_3}' || char(10) || char(10) || 'Please let me know what works best for you! You can also reach me on WhatsApp/Telegram at +855 96 98 123 54 for quick coordination.',
   'Je serais ravie de vous faire visiter notre école. Je suis disponible :' || char(10) || char(10) || '- {date_time_1}' || char(10) || '- {date_time_2}' || char(10) || '- {date_time_3}' || char(10) || char(10) || 'Merci de me faire savoir ce qui vous convient le mieux ! Vous pouvez également me joindre sur WhatsApp/Telegram au +855 96 98 123 54 pour une coordination rapide.',
   CURRENT_TIMESTAMP),

  ('tmpl-pp-attachments', 'phnomPenh', 'attachments',
   'In the meantime, please find attached information about our school, including fees and registration forms.',
   'En attendant, vous trouverez ci-joint des informations sur notre école, y compris les tarifs et les formulaires d''inscription.',
   CURRENT_TIMESTAMP),

  ('tmpl-pp-closing', 'phnomPenh', 'closing',
   'Wishing you a very nice day.' || char(10) || char(10) || 'Best regards,' || char(10) || char(10) || 'Anne-Sophie Grasset' || char(10) || 'Executive Director' || char(10) || 'Acacia International Pre-school Phnom Penh' || char(10) || '+855 96 98 123 54',
   'Je vous souhaite une très belle journée.' || char(10) || char(10) || 'Bien cordialement,' || char(10) || char(10) || 'Anne-Sophie Grasset' || char(10) || 'Directrice Exécutive' || char(10) || 'Acacia International Pre-school Phnom Penh' || char(10) || '+855 96 98 123 54',
   CURRENT_TIMESTAMP);
