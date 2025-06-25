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
        backgroundColor: '#374151',
    },
    txt: {
        fontSize: '3rem',
        marginBottom: '20px',
        color: '#9ca3af',  
        fontWeight: 'bold',
      
    },
    button: {
        fontSize: '1.5rem',
        padding: '10px 20px',
        backgroundColor: '#F5EE9E',
        border: 'none',
        borderRadius: '5px',
        color: '#9ca3af',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    
});
