export const isLibrary = function (str: string): boolean {
    const nonLibraries = [
      'ALL', 
      'ANY', 
      'ADULT BOOKS', 
      'ALL BRANCHES',
      'ALL HULL CITY LIBRARIES',
      'ALL LOCATIONS', 
      'ALL LIBRARIES', 
      'ALL', 
      'ANY LIBRARY', 
      'AUDIO BOOKS', 
      'CHILDREN\'S BOOKS', 
      'CHOOSE ONE',
      'DVDS', 
      'FICTION', 
      'HERE', 
      'INVALID KEY', 
      'LARGE PRINT', 
      'LOCAL HISTORY', 
      'NON-FICTION', 
      'SCHOOL LIBRARIES COLLECTIONS', 
      'SELECT AN ALTERNATIVE',
      'SELECT BRANCH',
      'SELECT DEFAULT BRANCH',
      'SELECT LIBRARY', 
      'VIEW ENTIRE COLLECTION', 
      'YOUNG ADULT COLLECTION'
    ];
    return !nonLibraries.includes(str.toUpperCase());
  };