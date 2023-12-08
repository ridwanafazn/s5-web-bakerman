import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/chance.css'

const Chance = () => {
  const [name, setName] = useState('');
  const [chance, setChance] = useState(0);
  const [stravaLink, setStravaLink] = useState('');
  const [buyHistory, setBuyHistory] = useState([]);

  useEffect(() => {
    // Fetch user data (replace 'your-api-endpoint' with your actual API endpoint)
    axios.get('your-api-endpoint/user')
      .then(response => {
        setName(response.data.name);
        setChance(response.data.chance);
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
      });

    // Fetch buy history (replace 'your-api-endpoint' with your actual API endpoint)
    axios.get('your-api-endpoint/buy-history')
      .then(response => {
        setBuyHistory(response.data);
      })
      .catch(error => {
        console.error('Error fetching buy history:', error);
      });
  }, []); // Empty dependency array means this effect runs once after the initial render

  const handleStravaLinkSubmit = () => {
    // Make a POST request to save the Strava link (replace 'your-api-endpoint' with your actual API endpoint)
    axios.post('your-api-endpoint/strava-link', { link: stravaLink })
      .then(response => {
        // Handle success, e.g., show a success message
        console.log('Strava link saved successfully:', response.data);
      })
      .catch(error => {
        // Handle error, e.g., show an error message
        console.error('Error saving Strava link:', error);
      });
  };

  return (
    <div className="chance-container">
      <section>
        <h1>Hello {name}</h1>
      </section>
      <section>
        <p>Your remaining purchasing opportunities this week: {chance}</p>
        <div>
          <label>
            Redeem your Strava here:
            <input
              type="text"
              value={stravaLink}
              onChange={(e) => setStravaLink(e.target.value)}
            />
          </label>
          <button onClick={handleStravaLinkSubmit}>Submit</button>
        </div>
      </section>
      <section>
        <h2>Buy history for this week</h2>
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Product List</th>
              <th>Price</th>
              <th>Date</th>
            </tr>
          </thead>
          {/* <tbody>
            {buyHistory.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.productList}</td>
                <td>{item.price}</td>
                <td>{item.date}</td>
              </tr>
            ))}
          </tbody> */}
        </table>
      </section>
    </div>
  );
};

export default Chance;
