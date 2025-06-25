import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { Text, StyleSheet } from 'react-native';

export default function Modules() {
    const navigate = useNavigate();

    return (
        <div className="modules" style={styles.container}>
            <Text style={styles.text}>Modules</Text>
            <Button
                variant="success"
                style={styles.button}
                onClick={() => navigate('/Main')}
            >
                Vowel
            </Button>
            <Button
                variant="success"
                style={styles.button}
                onClick={() => navigate('/Main')}
            >
                Stress
            </Button>
        </div>
    );
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#080133',
        
    },
    text: {
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
        marginVertical: 10,
        marginBottom: 20,
    },
});