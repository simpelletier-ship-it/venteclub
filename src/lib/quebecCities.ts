// Liste complète des villes du Québec (dédupliquée)
export const quebecCities = [...new Set([
  // Grandes villes
  "Montréal", "Québec", "Laval", "Gatineau", "Longueuil", "Sherbrooke", "Saguenay", "Lévis", "Trois-Rivières", "Terrebonne",
  
  // Villes moyennes
  "Saint-Jean-sur-Richelieu", "Repentigny", "Boucherville", "Drummondville", "Saint-Jérôme", "Granby", "Blainville", "Saint-Hyacinthe",
  "Shawinigan", "Dollard-des-Ormeaux", "Châteauguay", "Rimouski", "Victoriaville", "Sorel-Tracy", "Salaberry-de-Valleyfield",
  "Saint-Eustache", "Mascouche", "Rouyn-Noranda", "Mirabel", "Val-d'Or", "Alma", "Vaudreuil-Dorion", "Sept-Îles", "Sainte-Julie",
  "Thetford Mines", "Côte-Saint-Luc", "Brossard", "Beaconsfield", "La Prairie", "Saint-Lambert", "Candiac", "Varennes", "Chambly",
  "Mont-Royal", "Sainte-Thérèse", "Joliette", "Saint-Bruno-de-Montarville", "Matane", "Westmount", "Pointe-Claire", "Magog",
  "Mont-Saint-Hilaire", "Saint-Constant", "Rosemère", "Boisbriand", "L'Assomption", "Baie-Comeau", "Saint-Basile-le-Grand",
  "Sainte-Marthe-sur-le-Lac", "Pincourt", "Rivière-du-Loup", "Sainte-Catherine", "Lavaltrie", "Prévost", "Dorval", "Kirkland",
  "Saint-Lazare", "Deux-Montagnes", "Sainte-Anne-des-Plaines", "Cowansville", "Mercier", "Sainte-Sophie", "L'Île-Perrot",
  "Notre-Dame-de-l'Île-Perrot", "Saint-Augustin-de-Desmaures", "Saint-Lin-Laurentides", "Lorraine", "Amos", "Delson", "Beauharnois",
  "Saint-Charles-Borromée", "Cantley", "Sainte-Adèle", "Charlemagne", "La Tuque", "Mont-Tremblant", "Saint-Colomban",
  
  // Autres villes importantes
  "Acton Vale", "Amqui", "Asbestos", "Baie-D'Urfé", "Beauceville", "Beaupré", "Bécancour", "Bedford", "Belœil", "Beloeil",
  "Bromont", "Brownsburg-Chatham", "Cap-Chat", "Cap-Santé", "Carignan", "Causapscal", "Chambord", "Chandler", "Chertsey", "Chute-aux-Outardes",
  "Coaticook", "Contrecoeur", "Cookshire-Eaton", "Coteau-du-Lac", "Danville", "Dégelis", "Disraeli", "Dolbeau-Mistassini", "Donnacona", "Dunham",
  "East Angus", "Farnham", "Fermont", "Forestville", "Fort-Coulonge", "Fossambault-sur-le-Lac", "Gaspé", "Gracefield", "Grande-Rivière", "Grenville",
  "Grenville-sur-la-Rouge", "Hampton", "Hampstead", "Hauterive", "Hérouxville", "Hudson", "Huntingdon", "L'Ancienne-Lorette", "L'Ange-Gardien",
  "L'Épiphanie", "La Malbaie", "La Minerve", "La Pocatière", "La Sarre", "Labelle", "Lac-Brome", "Lac-Delage", "Lac-Etchemin", "Lac-Mégantic",
  "Lac-Saint-Charles", "Lac-Saint-Joseph", "Lachute", "Lacolle", "Laurier-Station", "Les Cèdres", "Les Coteaux", "Les Escoumins", "Les Îles-de-la-Madeleine",
  "Lingwick", "Louiseville", "Macamic", "Maniwaki", "Marieville", "McMasterville", "Melocheville", "Métabetchouan-Lac-à-la-Croix",
  "Métis-sur-Mer", "Mistassini", "Mont-Joli", "Mont-Laurier", "Mont-Saint-Grégoire", "Montmagny", "Montréal-Est", "Montréal-Ouest", "Morin-Heights",
  "Murdochville", "Neuville", "New Richmond", "Nicolet", "Nominingue", "Normandin", "Notre-Dame-de-Grâce", "Notre-Dame-des-Prairies",
  "Oka", "Otterburn Park", "Papineauville", "Paspébiac", "Percé", "Pierreville", "Piedmont", "Plessisville", "Pohénégamook", "Pont-Rouge",
  "Port-Cartier", "Portneuf", "Princeville", "Rawdon", "Richelieu", "Richmond", "Rigaud", "Roberval", "Rougemont", "Roxboro",
  "Sacré-Coeur", "Saint-Adolphe-d'Howard", "Saint-Alexandre", "Saint-Amable", "Saint-Ambroise", "Saint-André-Avellin", "Saint-Anselme", "Saint-Antoine-sur-Richelieu",
  "Saint-Apollinaire", "Saint-Athanase", "Saint-Barnabé-Sud", "Saint-Barthélemy", "Saint-Blaise-sur-Richelieu", "Saint-Boniface", "Saint-Bruno", "Saint-Césaire",
  "Saint-Charles-sur-Richelieu", "Saint-Christophe-d'Arthabaska", "Saint-Cyrille-de-Wendover", "Saint-Denis-sur-Richelieu", "Saint-Donat", "Saint-Éphrem-de-Beauce",
  "Saint-Étienne-de-Lauzon", "Saint-Félicien", "Saint-Félix-de-Valois", "Saint-François-du-Lac", "Saint-Gabriel", "Saint-Gabriel-de-Brandon", "Saint-Georges",
  "Saint-Gédéon", "Saint-Henri", "Saint-Hippolyte", "Saint-Honoré", "Saint-Isidore", "Saint-Jacques", "Saint-Jean-Baptiste",
  "Saint-Jean-de-Matha", "Saint-Jean-Port-Joli", "Saint-Joseph-de-Beauce", "Saint-Joseph-de-Sorel", "Saint-Joseph-du-Lac",
  "Saint-Laurent", "Saint-Léonard", "Saint-Liboire", "Saint-Marc-des-Carrières", "Saint-Marc-sur-Richelieu", "Saint-Mathias-sur-Richelieu", "Saint-Mathieu",
  "Saint-Mathieu-de-Beloeil", "Saint-Michel", "Saint-Michel-des-Saints", "Saint-Nazaire", "Saint-Pacôme", "Saint-Pascal", "Saint-Paul",
  "Saint-Paul-d'Abbotsford", "Saint-Philippe", "Saint-Pie", "Saint-Pierre-les-Becquets", "Saint-Prime", "Saint-Raymond", "Saint-Rémi",
  "Saint-Roch-de-l'Achigan", "Saint-Roch-de-Richelieu", "Saint-Romuald", "Saint-Sauveur", "Saint-Tite", "Saint-Urbain-Premier", "Saint-Zotique",
  "Sainte-Agathe-des-Monts", "Sainte-Anne-de-Beaupré", "Sainte-Anne-de-Bellevue", "Sainte-Anne-de-la-Pérade", "Sainte-Anne-des-Monts",
  "Sainte-Brigitte-de-Laval", "Sainte-Catherine-de-la-Jacques-Cartier", "Sainte-Claire", "Sainte-Croix",
  "Sainte-Geneviève-de-Berthier", "Sainte-Julienne", "Sainte-Marie", "Sainte-Martine", "Sainte-Mélanie",
  "Schefferville", "Scotstown", "Senneterre", "Shannon", "Shawville",
  "Sillery", "Stanstead", "Stoneham-et-Tewkesbury", "Sutton", "Témiscaming", "Témiscouata-sur-le-Lac",
  "Thurso", "Tingwick", "Trois-Pistoles", "Val-Bélair", "Val-David", "Val-des-Monts",
  "Val-Morin", "Valcourt", "Verchères", "Ville-Marie", "Warwick", "Waterloo", "Waterville",
  "Weedon", "Wendake", "Windsor", "Yamachiche"
])].sort();
