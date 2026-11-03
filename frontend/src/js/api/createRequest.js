const createRequest = async (url, options = {}) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    if (response.status === 409) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'This name is already taken!');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export default createRequest;