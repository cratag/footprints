const I18n = (() => {
  const LANGS = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
    { code: 'pt', name: 'Português' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
  ];
  const STORAGE_KEY = 'footprints:lang';
  const FALLBACK = 'en';

  const D = {};

  D.es = {
    language: 'Idioma',
    themeLight: 'Modo claro',
    themeDark: 'Modo oscuro',
    tagline: 'Tus trayectos, día a día',
    lead: 'Sube el archivo exportado de Google Maps Timeline y recorre cada día paso a paso en el mapa. Todo se procesa en tu navegador.',
    dzTitle: 'Arrastra tu archivo aquí',
    dzSub: 'o haz clic para elegirlo · <code>Timeline.json</code>, <code>location-history.json</code> o el <code>.zip</code> de Takeout · también una copia exportada desde aquí',
    demoBtn: 'Probar con datos de ejemplo',
    geocodeOpt: 'Buscar nombres de lugares faltantes en OpenStreetMap <small>(envía coordenadas a nominatim.openstreetmap.org)</small>',
    howtoSummary: '¿Cómo exporto mis rutas?',
    howtoPhone: 'Google guarda la Cronología en tu celular, así que tus rutas recientes se exportan desde ahí.',
    ios1: 'Abre <b>Google Maps</b> → tu foto → <b>Tu cronología</b>.',
    ios2: 'Toca <b>⋮</b> (o <b>⋯</b> en iPhone) → <b>Ajustes de ubicación y privacidad</b>.',
    ios3: 'Baja hasta el final, toca <b>Exportar datos de Cronología</b> y guarda el archivo.',
    madeBy: 'Hecho por',

    homeTitle: 'Volver a cargar archivo',
    exportBtn: 'Exportar',
    exportTitle: 'Descargar una copia con tus ediciones',
    newBtn: 'Nuevo',
    newTitle: 'Subir otro archivo',
    newAria: 'Nuevo archivo',
    prevMonth: 'Mes anterior',
    nextMonth: 'Mes siguiente',
    prevDay: 'Día anterior',
    nextDay: 'Día siguiente',
    ctlRestart: 'Reiniciar (Inicio)',
    ctlPrev: 'Paso anterior (←)',
    ctlNext: 'Siguiente',
    ctlNextTitle: 'Siguiente paso (→)',
    ctlNextDay: 'Siguiente día',
    ctlNextDayTitle: 'Siguiente día (→)',
    ctlPlay: 'Reproducir (espacio)',
    ctlAll: 'Ver día completo (fin)',

    mode_WALKING: 'Caminando',
    mode_RUNNING: 'Corriendo',
    mode_CYCLING: 'En bicicleta',
    mode_IN_PASSENGER_VEHICLE: 'En auto',
    mode_MOTORCYCLING: 'En moto',
    mode_IN_TAXI: 'En taxi',
    mode_IN_BUS: 'En autobús',
    mode_IN_SUBWAY: 'En metro',
    mode_IN_TRAIN: 'En tren',
    mode_IN_TRAM: 'En tranvía',
    mode_PUBLIC_TRANSIT: 'En transporte público',
    mode_FLYING: 'En avión',
    mode_IN_FERRY: 'En barco',
    mode_SKIING: 'Esquiando',
    mode_UNKNOWN: 'Desplazamiento',

    edit_WALKING: 'A pie',
    edit_IN_TAXI: 'Taxi',
    edit_MOTORCYCLING: 'Moto',
    edit_IN_PASSENGER_VEHICLE: 'Auto',
    edit_PUBLIC_TRANSIT: 'Transporte público',
    edit_FLYING: 'Avión',
    edit_IN_FERRY: 'Barco',
    edit_UNKNOWN: 'Otro',

    home: 'Casa',
    work: 'Trabajo',
    unnamedPlace: 'Lugar sin nombre',
    trips_one: '{n} trayecto',
    trips_other: '{n} trayectos',
    places_one: '{n} lugar',
    places_other: '{n} lugares',

    startAt: 'Inicio en {place}',
    dayStart: 'Inicio del día',
    untilTime: 'Hasta las {time}',
    alreadyMoving: 'Ya en movimiento',
    moveTo: '{mode} a {place}',
    stay: 'estancia {dur}',
    edited: 'editado',
    edit: 'Editar',
    editAria: 'Editar este paso',
    edTransport: 'Medio de transporte',
    edDestination: 'Lugar de destino',
    edPlaceName: 'Nombre del lugar',
    edRevert: 'Restaurar original',
    edCancel: 'Cancelar',
    edSave: 'Guardar',

    inMotion: 'En movimiento',
    leftAt: 'Saliste a las <b>{time}</b>',
    arrivedAt: 'Llegaste a las <b>{time}</b>',
    sinceTime: 'Desde las <b>{time}</b>',
    durHere: '{dur} aquí',
    visit: 'Visita',
    startTip: 'Inicio',
    streetViewTitle: 'Abrir Street View en Google Maps',
    streetViewCta: 'Ver en Street View ↗',

    reading: 'Leyendo archivo…',
    unzipping: 'Descomprimiendo…',
    processing: 'Procesando recorridos…',
    unknownFormat: 'No pude reconocer el formato. Usa el archivo exportado de <b>Cronología</b> (Timeline.json) o el .zip de Takeout con <i>Semantic Location History</i>.',
    emptyFile: 'El archivo no contiene visitas ni trayectos.',
    processError: 'Ocurrió un error al procesar el archivo: {msg}',
    resume: 'Continuar con mis datos ({from} – {to})',
  };

  D.en = {
    language: 'Language',
    themeLight: 'Light mode',
    themeDark: 'Dark mode',
    tagline: 'Your trips, day to day',
    lead: 'Upload your Google Maps Timeline export and replay each day step by step on the map. Everything is processed in your browser.',
    dzTitle: 'Drop your file here',
    dzSub: 'or click to choose it · <code>Timeline.json</code>, <code>location-history.json</code> or the Takeout <code>.zip</code> · also a copy exported from here',
    demoBtn: 'Try with sample data',
    geocodeOpt: 'Look up missing place names on OpenStreetMap <small>(sends coordinates to nominatim.openstreetmap.org)</small>',
    howtoSummary: 'How do I export my routes?',
    howtoPhone: 'Google stores your Timeline on your phone, so recent routes are exported from there.',
    ios1: 'Open <b>Google Maps</b> → your profile picture → <b>Your Timeline</b>.',
    ios2: 'Tap <b>⋮</b> (or <b>⋯</b> on iPhone) → <b>Location and privacy settings</b>.',
    ios3: 'Scroll to the bottom, tap <b>Export Timeline data</b> and save the file.',
    madeBy: 'Made by',

    homeTitle: 'Back to file upload',
    exportBtn: 'Export',
    exportTitle: 'Download a copy with your edits',
    newBtn: 'New',
    newTitle: 'Upload another file',
    newAria: 'New file',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    prevDay: 'Previous day',
    nextDay: 'Next day',
    ctlRestart: 'Restart (Home)',
    ctlPrev: 'Previous step (←)',
    ctlNext: 'Next',
    ctlNextTitle: 'Next step (→)',
    ctlNextDay: 'Next day',
    ctlNextDayTitle: 'Next day (→)',
    ctlPlay: 'Play (space)',
    ctlAll: 'Show whole day (End)',

    mode_WALKING: 'Walking',
    mode_RUNNING: 'Running',
    mode_CYCLING: 'Cycling',
    mode_IN_PASSENGER_VEHICLE: 'Driving',
    mode_MOTORCYCLING: 'By motorcycle',
    mode_IN_TAXI: 'By taxi',
    mode_IN_BUS: 'By bus',
    mode_IN_SUBWAY: 'By subway',
    mode_IN_TRAIN: 'By train',
    mode_IN_TRAM: 'By tram',
    mode_PUBLIC_TRANSIT: 'By public transit',
    mode_FLYING: 'Flying',
    mode_IN_FERRY: 'By boat',
    mode_SKIING: 'Skiing',
    mode_UNKNOWN: 'Moving',

    edit_WALKING: 'On foot',
    edit_IN_TAXI: 'Taxi',
    edit_MOTORCYCLING: 'Motorcycle',
    edit_IN_PASSENGER_VEHICLE: 'Car',
    edit_PUBLIC_TRANSIT: 'Public transit',
    edit_FLYING: 'Plane',
    edit_IN_FERRY: 'Boat',
    edit_UNKNOWN: 'Other',

    home: 'Home',
    work: 'Work',
    unnamedPlace: 'Unnamed place',
    trips_one: '{n} trip',
    trips_other: '{n} trips',
    places_one: '{n} place',
    places_other: '{n} places',

    startAt: 'Start at {place}',
    dayStart: 'Start of the day',
    untilTime: 'Until {time}',
    alreadyMoving: 'Already on the move',
    moveTo: '{mode} to {place}',
    stay: 'stayed {dur}',
    edited: 'edited',
    edit: 'Edit',
    editAria: 'Edit this step',
    edTransport: 'Mode of transport',
    edDestination: 'Destination',
    edPlaceName: 'Place name',
    edRevert: 'Restore original',
    edCancel: 'Cancel',
    edSave: 'Save',

    inMotion: 'On the move',
    leftAt: 'You left at <b>{time}</b>',
    arrivedAt: 'You arrived at <b>{time}</b>',
    sinceTime: 'Since <b>{time}</b>',
    durHere: '{dur} here',
    visit: 'Visit',
    startTip: 'Start',
    streetViewTitle: 'Open Street View in Google Maps',
    streetViewCta: 'View in Street View ↗',

    reading: 'Reading file…',
    unzipping: 'Unzipping…',
    processing: 'Processing routes…',
    unknownFormat: 'Couldn’t recognize the format. Use the file exported from <b>Timeline</b> (Timeline.json) or the Takeout .zip with <i>Semantic Location History</i>.',
    emptyFile: 'The file contains no visits or trips.',
    processError: 'Something went wrong while processing the file: {msg}',
    resume: 'Continue with my data ({from} – {to})',
  };

  D.pt = {
    language: 'Idioma',
    themeLight: 'Modo claro',
    themeDark: 'Modo escuro',
    tagline: 'Seus trajetos, dia a dia',
    lead: 'Envie o arquivo exportado da Linha do tempo do Google Maps e percorra cada dia passo a passo no mapa. Tudo é processado no seu navegador.',
    dzTitle: 'Arraste seu arquivo aqui',
    dzSub: 'ou clique para escolher · <code>Timeline.json</code>, <code>location-history.json</code> ou o <code>.zip</code> do Takeout · também uma cópia exportada daqui',
    demoBtn: 'Testar com dados de exemplo',
    geocodeOpt: 'Buscar nomes de lugares ausentes no OpenStreetMap <small>(envia coordenadas para nominatim.openstreetmap.org)</small>',
    howtoSummary: 'Como exporto minhas rotas?',
    howtoPhone: 'O Google guarda a Linha do tempo no seu celular, então as rotas recentes são exportadas de lá.',
    ios1: 'Abra o <b>Google Maps</b> → sua foto → <b>Sua linha do tempo</b>.',
    ios2: 'Toque em <b>⋮</b> (ou <b>⋯</b> no iPhone) → <b>Configurações de local e privacidade</b>.',
    ios3: 'Role até o final, toque em <b>Exportar dados da Linha do tempo</b> e salve o arquivo.',
    madeBy: 'Feito por',

    homeTitle: 'Voltar ao envio de arquivo',
    exportBtn: 'Exportar',
    exportTitle: 'Baixar uma cópia com suas edições',
    newBtn: 'Novo',
    newTitle: 'Enviar outro arquivo',
    newAria: 'Novo arquivo',
    prevMonth: 'Mês anterior',
    nextMonth: 'Próximo mês',
    prevDay: 'Dia anterior',
    nextDay: 'Próximo dia',
    ctlRestart: 'Reiniciar (Home)',
    ctlPrev: 'Passo anterior (←)',
    ctlNext: 'Próximo',
    ctlNextTitle: 'Próximo passo (→)',
    ctlNextDay: 'Próximo dia',
    ctlNextDayTitle: 'Próximo dia (→)',
    ctlPlay: 'Reproduzir (espaço)',
    ctlAll: 'Ver o dia inteiro (End)',

    mode_WALKING: 'Caminhando',
    mode_RUNNING: 'Correndo',
    mode_CYCLING: 'De bicicleta',
    mode_IN_PASSENGER_VEHICLE: 'De carro',
    mode_MOTORCYCLING: 'De moto',
    mode_IN_TAXI: 'De táxi',
    mode_IN_BUS: 'De ônibus',
    mode_IN_SUBWAY: 'De metrô',
    mode_IN_TRAIN: 'De trem',
    mode_IN_TRAM: 'De bonde',
    mode_PUBLIC_TRANSIT: 'De transporte público',
    mode_FLYING: 'De avião',
    mode_IN_FERRY: 'De barco',
    mode_SKIING: 'Esquiando',
    mode_UNKNOWN: 'Deslocamento',

    edit_WALKING: 'A pé',
    edit_IN_TAXI: 'Táxi',
    edit_MOTORCYCLING: 'Moto',
    edit_IN_PASSENGER_VEHICLE: 'Carro',
    edit_PUBLIC_TRANSIT: 'Transporte público',
    edit_FLYING: 'Avião',
    edit_IN_FERRY: 'Barco',
    edit_UNKNOWN: 'Outro',

    home: 'Casa',
    work: 'Trabalho',
    unnamedPlace: 'Lugar sem nome',
    trips_one: '{n} trajeto',
    trips_other: '{n} trajetos',
    places_one: '{n} lugar',
    places_other: '{n} lugares',

    startAt: 'Início em {place}',
    dayStart: 'Início do dia',
    untilTime: 'Até as {time}',
    alreadyMoving: 'Já em movimento',
    moveTo: '{mode} até {place}',
    stay: 'permanência {dur}',
    edited: 'editado',
    edit: 'Editar',
    editAria: 'Editar este passo',
    edTransport: 'Meio de transporte',
    edDestination: 'Lugar de destino',
    edPlaceName: 'Nome do lugar',
    edRevert: 'Restaurar original',
    edCancel: 'Cancelar',
    edSave: 'Salvar',

    inMotion: 'Em movimento',
    leftAt: 'Você saiu às <b>{time}</b>',
    arrivedAt: 'Você chegou às <b>{time}</b>',
    sinceTime: 'Desde as <b>{time}</b>',
    durHere: '{dur} aqui',
    visit: 'Visita',
    startTip: 'Início',
    streetViewTitle: 'Abrir o Street View no Google Maps',
    streetViewCta: 'Ver no Street View ↗',

    reading: 'Lendo arquivo…',
    unzipping: 'Descompactando…',
    processing: 'Processando percursos…',
    unknownFormat: 'Não consegui reconhecer o formato. Use o arquivo exportado da <b>Linha do tempo</b> (Timeline.json) ou o .zip do Takeout com <i>Semantic Location History</i>.',
    emptyFile: 'O arquivo não contém visitas nem trajetos.',
    processError: 'Ocorreu um erro ao processar o arquivo: {msg}',
    resume: 'Continuar com meus dados ({from} – {to})',
  };

  D.fr = {
    language: 'Langue',
    themeLight: 'Mode clair',
    themeDark: 'Mode sombre',
    tagline: 'Vos trajets, jour après jour',
    lead: 'Importez l’export de votre Historique Google Maps et parcourez chaque journée étape par étape sur la carte. Tout est traité dans votre navigateur.',
    dzTitle: 'Déposez votre fichier ici',
    dzSub: 'ou cliquez pour le choisir · <code>Timeline.json</code>, <code>location-history.json</code> ou le <code>.zip</code> de Takeout · ou une copie exportée depuis ici',
    demoBtn: 'Essayer avec des données d’exemple',
    geocodeOpt: 'Rechercher les noms de lieux manquants sur OpenStreetMap <small>(envoie les coordonnées à nominatim.openstreetmap.org)</small>',
    howtoSummary: 'Comment exporter mes trajets ?',
    howtoPhone: 'Google conserve votre Historique sur votre téléphone : les trajets récents s’exportent donc depuis celui-ci.',
    ios1: 'Ouvrez <b>Google Maps</b> → votre photo → <b>Votre historique</b>.',
    ios2: 'Appuyez sur <b>⋮</b> (ou <b>⋯</b> sur iPhone) → <b>Paramètres de localisation et de confidentialité</b>.',
    ios3: 'Faites défiler jusqu’en bas, appuyez sur <b>Exporter les données de l’historique</b> et enregistrez le fichier.',
    madeBy: 'Créé par',

    homeTitle: 'Revenir à l’import du fichier',
    exportBtn: 'Exporter',
    exportTitle: 'Télécharger une copie avec vos modifications',
    newBtn: 'Nouveau',
    newTitle: 'Importer un autre fichier',
    newAria: 'Nouveau fichier',
    prevMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    prevDay: 'Jour précédent',
    nextDay: 'Jour suivant',
    ctlRestart: 'Recommencer (Début)',
    ctlPrev: 'Étape précédente (←)',
    ctlNext: 'Suivant',
    ctlNextTitle: 'Étape suivante (→)',
    ctlNextDay: 'Jour suivant',
    ctlNextDayTitle: 'Jour suivant (→)',
    ctlPlay: 'Lecture (espace)',
    ctlAll: 'Voir toute la journée (Fin)',

    mode_WALKING: 'À pied',
    mode_RUNNING: 'En courant',
    mode_CYCLING: 'À vélo',
    mode_IN_PASSENGER_VEHICLE: 'En voiture',
    mode_MOTORCYCLING: 'À moto',
    mode_IN_TAXI: 'En taxi',
    mode_IN_BUS: 'En bus',
    mode_IN_SUBWAY: 'En métro',
    mode_IN_TRAIN: 'En train',
    mode_IN_TRAM: 'En tram',
    mode_PUBLIC_TRANSIT: 'En transports en commun',
    mode_FLYING: 'En avion',
    mode_IN_FERRY: 'En bateau',
    mode_SKIING: 'À ski',
    mode_UNKNOWN: 'Déplacement',

    edit_WALKING: 'À pied',
    edit_IN_TAXI: 'Taxi',
    edit_MOTORCYCLING: 'Moto',
    edit_IN_PASSENGER_VEHICLE: 'Voiture',
    edit_PUBLIC_TRANSIT: 'Transports en commun',
    edit_FLYING: 'Avion',
    edit_IN_FERRY: 'Bateau',
    edit_UNKNOWN: 'Autre',

    home: 'Domicile',
    work: 'Travail',
    unnamedPlace: 'Lieu sans nom',
    trips_one: '{n} trajet',
    trips_other: '{n} trajets',
    places_one: '{n} lieu',
    places_other: '{n} lieux',

    startAt: 'Départ de {place}',
    dayStart: 'Début de la journée',
    untilTime: 'Jusqu’à {time}',
    alreadyMoving: 'Déjà en déplacement',
    moveTo: '{mode} vers {place}',
    stay: 'sur place {dur}',
    edited: 'modifié',
    edit: 'Modifier',
    editAria: 'Modifier cette étape',
    edTransport: 'Moyen de transport',
    edDestination: 'Lieu d’arrivée',
    edPlaceName: 'Nom du lieu',
    edRevert: 'Restaurer l’original',
    edCancel: 'Annuler',
    edSave: 'Enregistrer',

    inMotion: 'En déplacement',
    leftAt: 'Parti à <b>{time}</b>',
    arrivedAt: 'Arrivé à <b>{time}</b>',
    sinceTime: 'Depuis <b>{time}</b>',
    durHere: '{dur} ici',
    visit: 'Visite',
    startTip: 'Départ',
    streetViewTitle: 'Ouvrir Street View dans Google Maps',
    streetViewCta: 'Voir dans Street View ↗',

    reading: 'Lecture du fichier…',
    unzipping: 'Décompression…',
    processing: 'Traitement des trajets…',
    unknownFormat: 'Format non reconnu. Utilisez le fichier exporté depuis l’<b>Historique</b> (Timeline.json) ou le .zip de Takeout avec <i>Semantic Location History</i>.',
    emptyFile: 'Le fichier ne contient ni visites ni trajets.',
    processError: 'Une erreur est survenue lors du traitement du fichier : {msg}',
    resume: 'Continuer avec mes données ({from} – {to})',
  };

  D.de = {
    language: 'Sprache',
    themeLight: 'Heller Modus',
    themeDark: 'Dunkler Modus',
    tagline: 'Deine Wege, Tag für Tag',
    lead: 'Lade deinen Google Maps Zeitachse-Export hoch und geh jeden Tag Schritt für Schritt auf der Karte durch. Alles wird in deinem Browser verarbeitet.',
    dzTitle: 'Datei hierher ziehen',
    dzSub: 'oder klicken zum Auswählen · <code>Timeline.json</code>, <code>location-history.json</code> oder die Takeout-<code>.zip</code> · auch eine hier exportierte Kopie',
    demoBtn: 'Mit Beispieldaten testen',
    geocodeOpt: 'Fehlende Ortsnamen bei OpenStreetMap nachschlagen <small>(sendet Koordinaten an nominatim.openstreetmap.org)</small>',
    howtoSummary: 'Wie exportiere ich meine Routen?',
    howtoPhone: 'Google speichert die Zeitachse auf deinem Handy, daher werden aktuelle Routen von dort exportiert.',
    ios1: 'Öffne <b>Google Maps</b> → dein Profilbild → <b>Deine Zeitachse</b>.',
    ios2: 'Tippe auf <b>⋮</b> (bzw. <b>⋯</b> auf dem iPhone) → <b>Standort- und Datenschutzeinstellungen</b>.',
    ios3: 'Scrolle ganz nach unten, tippe auf <b>Zeitachsendaten exportieren</b> und speichere die Datei.',
    madeBy: 'Erstellt von',

    homeTitle: 'Zurück zum Hochladen',
    exportBtn: 'Exportieren',
    exportTitle: 'Eine Kopie mit deinen Änderungen herunterladen',
    newBtn: 'Neu',
    newTitle: 'Andere Datei hochladen',
    newAria: 'Neue Datei',
    prevMonth: 'Vorheriger Monat',
    nextMonth: 'Nächster Monat',
    prevDay: 'Vorheriger Tag',
    nextDay: 'Nächster Tag',
    ctlRestart: 'Neu starten (Pos1)',
    ctlPrev: 'Vorheriger Schritt (←)',
    ctlNext: 'Weiter',
    ctlNextTitle: 'Nächster Schritt (→)',
    ctlNextDay: 'Nächster Tag',
    ctlNextDayTitle: 'Nächster Tag (→)',
    ctlPlay: 'Abspielen (Leertaste)',
    ctlAll: 'Ganzen Tag anzeigen (Ende)',

    mode_WALKING: 'Zu Fuß',
    mode_RUNNING: 'Laufend',
    mode_CYCLING: 'Mit dem Fahrrad',
    mode_IN_PASSENGER_VEHICLE: 'Mit dem Auto',
    mode_MOTORCYCLING: 'Mit dem Motorrad',
    mode_IN_TAXI: 'Mit dem Taxi',
    mode_IN_BUS: 'Mit dem Bus',
    mode_IN_SUBWAY: 'Mit der U-Bahn',
    mode_IN_TRAIN: 'Mit dem Zug',
    mode_IN_TRAM: 'Mit der Straßenbahn',
    mode_PUBLIC_TRANSIT: 'Mit Öffis',
    mode_FLYING: 'Mit dem Flugzeug',
    mode_IN_FERRY: 'Mit dem Schiff',
    mode_SKIING: 'Beim Skifahren',
    mode_UNKNOWN: 'Unterwegs',

    edit_WALKING: 'Zu Fuß',
    edit_IN_TAXI: 'Taxi',
    edit_MOTORCYCLING: 'Motorrad',
    edit_IN_PASSENGER_VEHICLE: 'Auto',
    edit_PUBLIC_TRANSIT: 'ÖPNV',
    edit_FLYING: 'Flugzeug',
    edit_IN_FERRY: 'Schiff',
    edit_UNKNOWN: 'Andere',

    home: 'Zuhause',
    work: 'Arbeit',
    unnamedPlace: 'Unbenannter Ort',
    trips_one: '{n} Strecke',
    trips_other: '{n} Strecken',
    places_one: '{n} Ort',
    places_other: '{n} Orte',

    startAt: 'Start: {place}',
    dayStart: 'Tagesbeginn',
    untilTime: 'Bis {time}',
    alreadyMoving: 'Schon unterwegs',
    moveTo: '{mode} → {place}',
    stay: 'Aufenthalt {dur}',
    edited: 'bearbeitet',
    edit: 'Bearbeiten',
    editAria: 'Diesen Schritt bearbeiten',
    edTransport: 'Verkehrsmittel',
    edDestination: 'Zielort',
    edPlaceName: 'Name des Ortes',
    edRevert: 'Original wiederherstellen',
    edCancel: 'Abbrechen',
    edSave: 'Speichern',

    inMotion: 'Unterwegs',
    leftAt: 'Losgegangen um <b>{time}</b>',
    arrivedAt: 'Angekommen um <b>{time}</b>',
    sinceTime: 'Seit <b>{time}</b>',
    durHere: '{dur} hier',
    visit: 'Besuch',
    startTip: 'Start',
    streetViewTitle: 'Street View in Google Maps öffnen',
    streetViewCta: 'In Street View ansehen ↗',

    reading: 'Datei wird gelesen…',
    unzipping: 'Wird entpackt…',
    processing: 'Routen werden verarbeitet…',
    unknownFormat: 'Format nicht erkannt. Verwende die aus der <b>Zeitachse</b> exportierte Datei (Timeline.json) oder die Takeout-.zip mit <i>Semantic Location History</i>.',
    emptyFile: 'Die Datei enthält keine Besuche oder Strecken.',
    processError: 'Beim Verarbeiten der Datei ist ein Fehler aufgetreten: {msg}',
    resume: 'Mit meinen Daten fortfahren ({from} – {to})',
  };

  D.it = {
    language: 'Lingua',
    themeLight: 'Modalità chiara',
    themeDark: 'Modalità scura',
    tagline: 'I tuoi spostamenti, giorno per giorno',
    lead: 'Carica il file esportato dalla Cronologia di Google Maps e ripercorri ogni giornata passo dopo passo sulla mappa. Tutto viene elaborato nel tuo browser.',
    dzTitle: 'Trascina qui il tuo file',
    dzSub: 'o fai clic per sceglierlo · <code>Timeline.json</code>, <code>location-history.json</code> o lo <code>.zip</code> di Takeout · anche una copia esportata da qui',
    demoBtn: 'Prova con dati di esempio',
    geocodeOpt: 'Cerca i nomi dei luoghi mancanti su OpenStreetMap <small>(invia le coordinate a nominatim.openstreetmap.org)</small>',
    howtoSummary: 'Come esporto i miei percorsi?',
    howtoPhone: 'Google salva la Cronologia sul tuo telefono, quindi i percorsi recenti si esportano da lì.',
    ios1: 'Apri <b>Google Maps</b> → la tua foto → <b>La tua cronologia</b>.',
    ios2: 'Tocca <b>⋮</b> (o <b>⋯</b> su iPhone) → <b>Impostazioni di posizione e privacy</b>.',
    ios3: 'Scorri fino in fondo, tocca <b>Esporta dati della cronologia</b> e salva il file.',
    madeBy: 'Realizzato da',

    homeTitle: 'Torna al caricamento del file',
    exportBtn: 'Esporta',
    exportTitle: 'Scarica una copia con le tue modifiche',
    newBtn: 'Nuovo',
    newTitle: 'Carica un altro file',
    newAria: 'Nuovo file',
    prevMonth: 'Mese precedente',
    nextMonth: 'Mese successivo',
    prevDay: 'Giorno precedente',
    nextDay: 'Giorno successivo',
    ctlRestart: 'Ricomincia (Inizio)',
    ctlPrev: 'Passo precedente (←)',
    ctlNext: 'Avanti',
    ctlNextTitle: 'Passo successivo (→)',
    ctlNextDay: 'Giorno dopo',
    ctlNextDayTitle: 'Giorno successivo (→)',
    ctlPlay: 'Riproduci (spazio)',
    ctlAll: 'Vedi tutta la giornata (Fine)',

    mode_WALKING: 'A piedi',
    mode_RUNNING: 'Di corsa',
    mode_CYCLING: 'In bicicletta',
    mode_IN_PASSENGER_VEHICLE: 'In auto',
    mode_MOTORCYCLING: 'In moto',
    mode_IN_TAXI: 'In taxi',
    mode_IN_BUS: 'In autobus',
    mode_IN_SUBWAY: 'In metropolitana',
    mode_IN_TRAIN: 'In treno',
    mode_IN_TRAM: 'In tram',
    mode_PUBLIC_TRANSIT: 'Con i mezzi pubblici',
    mode_FLYING: 'In aereo',
    mode_IN_FERRY: 'In nave',
    mode_SKIING: 'Sugli sci',
    mode_UNKNOWN: 'Spostamento',

    edit_WALKING: 'A piedi',
    edit_IN_TAXI: 'Taxi',
    edit_MOTORCYCLING: 'Moto',
    edit_IN_PASSENGER_VEHICLE: 'Auto',
    edit_PUBLIC_TRANSIT: 'Mezzi pubblici',
    edit_FLYING: 'Aereo',
    edit_IN_FERRY: 'Nave',
    edit_UNKNOWN: 'Altro',

    home: 'Casa',
    work: 'Lavoro',
    unnamedPlace: 'Luogo senza nome',
    trips_one: '{n} spostamento',
    trips_other: '{n} spostamenti',
    places_one: '{n} luogo',
    places_other: '{n} luoghi',

    startAt: 'Partenza da {place}',
    dayStart: 'Inizio della giornata',
    untilTime: 'Fino alle {time}',
    alreadyMoving: 'Già in movimento',
    moveTo: '{mode} verso {place}',
    stay: 'sosta {dur}',
    edited: 'modificato',
    edit: 'Modifica',
    editAria: 'Modifica questo passo',
    edTransport: 'Mezzo di trasporto',
    edDestination: 'Luogo di arrivo',
    edPlaceName: 'Nome del luogo',
    edRevert: 'Ripristina originale',
    edCancel: 'Annulla',
    edSave: 'Salva',

    inMotion: 'In movimento',
    leftAt: 'Sei partito alle <b>{time}</b>',
    arrivedAt: 'Sei arrivato alle <b>{time}</b>',
    sinceTime: 'Dalle <b>{time}</b>',
    durHere: '{dur} qui',
    visit: 'Visita',
    startTip: 'Partenza',
    streetViewTitle: 'Apri Street View in Google Maps',
    streetViewCta: 'Vedi in Street View ↗',

    reading: 'Lettura del file…',
    unzipping: 'Decompressione…',
    processing: 'Elaborazione dei percorsi…',
    unknownFormat: 'Formato non riconosciuto. Usa il file esportato dalla <b>Cronologia</b> (Timeline.json) o lo .zip di Takeout con <i>Semantic Location History</i>.',
    emptyFile: 'Il file non contiene visite né spostamenti.',
    processError: 'Si è verificato un errore durante l’elaborazione del file: {msg}',
    resume: 'Continua con i miei dati ({from} – {to})',
  };

  const supported = (c) => LANGS.some((l) => l.code === c);

  function detect() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && supported(saved)) return saved;
    } catch {}
    for (const l of navigator.languages || [navigator.language]) {
      const c = String(l || '').slice(0, 2).toLowerCase();
      if (supported(c)) return c;
    }
    return FALLBACK;
  }

  let lang = detect();
  const listeners = [];

  function t(key, vars) {
    let s = D[lang]?.[key] ?? D[FALLBACK][key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return s;
  }

  function tn(key, n, vars) {
    const form = new Intl.PluralRules(lang).select(n) === 'one' ? 'one' : 'other';
    return t(`${key}_${form}`, { n, ...vars });
  }

  function apply(root = document) {
    document.documentElement.lang = lang;
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
    root.querySelectorAll('[data-i18n-aria-label]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel)); });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    renderSwitches();
  }

  function setLang(code) {
    if (!supported(code) || code === lang) return;
    lang = code;
    try { localStorage.setItem(STORAGE_KEY, code); } catch {}
    apply();
    listeners.forEach((fn) => fn(lang));
  }

  function renderSwitches() {
    document.querySelectorAll('.lang-switch').forEach((sw) => {
      if (!sw.firstElementChild) {
        sw.innerHTML = `<button type="button" class="lang-btn" aria-haspopup="listbox" aria-expanded="false"><span class="lang-code"></span></button>
          <ul class="lang-menu" role="listbox" hidden>${LANGS.map((l) => `<li role="option" data-lang="${l.code}" tabindex="-1"><b>${l.code.toUpperCase()}</b><span>${l.name}</span></li>`).join('')}</ul>`;
      }
      const btn = sw.querySelector('.lang-btn');
      btn.querySelector('.lang-code').textContent = lang.toUpperCase();
      btn.title = t('language');
      btn.setAttribute('aria-label', `${t('language')}: ${LANGS.find((l) => l.code === lang).name}`);
      sw.querySelector('.lang-menu').setAttribute('aria-label', t('language'));
      sw.querySelectorAll('[data-lang]').forEach((li) => li.setAttribute('aria-selected', li.dataset.lang === lang));
    });
  }

  function closeMenus(except) {
    document.querySelectorAll('.lang-switch').forEach((sw) => {
      if (sw === except) return;
      sw.querySelector('.lang-menu')?.setAttribute('hidden', '');
      sw.querySelector('.lang-btn')?.setAttribute('aria-expanded', 'false');
    });
  }

  function openMenu(sw) {
    const menu = sw.querySelector('.lang-menu');
    menu.removeAttribute('hidden');
    sw.querySelector('.lang-btn').setAttribute('aria-expanded', 'true');
    (menu.querySelector(`[data-lang="${lang}"]`) || menu.firstElementChild).focus();
  }

  document.addEventListener('click', (e) => {
    const sw = e.target.closest('.lang-switch');
    closeMenus(sw);
    if (!sw) return;
    e.stopPropagation();
    const opt = e.target.closest('[data-lang]');
    if (opt) {
      closeMenus();
      sw.querySelector('.lang-btn').focus();
      setLang(opt.dataset.lang);
      return;
    }
    if (e.target.closest('.lang-btn')) {
      const menu = sw.querySelector('.lang-menu');
      if (menu.hasAttribute('hidden')) openMenu(sw); else closeMenus();
    }
  }, true);

  document.addEventListener('keydown', (e) => {
    const sw = e.target.closest?.('.lang-switch');
    if (!sw) return;
    const menu = sw.querySelector('.lang-menu');
    const open = !menu.hasAttribute('hidden');
    const items = [...menu.querySelectorAll('[data-lang]')];
    const i = items.indexOf(document.activeElement);
    e.stopPropagation();
    if (e.key === 'Escape' && open) { e.preventDefault(); closeMenus(); sw.querySelector('.lang-btn').focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) openMenu(sw); else items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (!open) openMenu(sw); else items[(i - 1 + items.length) % items.length].focus(); }
    else if ((e.key === 'Enter' || e.key === ' ') && open && i >= 0) { e.preventDefault(); items[i].click(); }
    else if (e.key === 'Tab' && open) closeMenus();
  }, true);

  return {
    t, tn, apply, setLang,
    get lang() { return lang; },
    langs: LANGS,
    onChange: (fn) => listeners.push(fn),
  };
})();

