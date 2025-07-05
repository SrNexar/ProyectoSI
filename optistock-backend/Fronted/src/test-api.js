// Script de prueba para verificar la API
const testAPI = async () => {
  try {
    const response = await fetch('http://localhost:4000/api/products');
    const data = await response.json();
    console.log('API Response:', data);
    console.log('Number of products:', data.length);
    
    if (data.length > 0) {
      console.log('First product structure:', data[0]);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

testAPI();
