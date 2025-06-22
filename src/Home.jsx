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
        backgroundColor: '#003049 ',
    },
    txt: {
        fontSize: '3rem',
        marginBottom: '20px',
        color: '#d62828',  
        fontWeight: 'bold',
      
    },
    button: {
        fontSize: '1.5rem',
        padding: '10px 20px',
        backgroundColor: '#f77f00',
        border: 'none',
        borderRadius: '5px',
        color: '#F3E37C',
        cursor: 'pointer',
    },
    
});
