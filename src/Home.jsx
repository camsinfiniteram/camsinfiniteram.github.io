import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { Text, StyleSheet } from 'react-native';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="home" style={styles.home}>
      <Text style={styles.txt}>VOCAL-ize</Text>
      <Button variant="success" style={styles.button} onClick={() => navigate('/main')}>
        Start
      </Button>
    </div>
  );
}

const styles = StyleSheet.create({
    home: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#080133',
    },
    txt: {
        fontSize: '3rem',
        marginBottom: '20px',
        color: '#FFFFFF',  
        fontWeight: 'bold',
      
    },
    button: {
        fontSize: '2rem',
        padding: '20px 40px',
        backgroundColor: '#FFFFFF',
        border: 'none',
        borderRadius: '5px',
        color: '#080133',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    
});
