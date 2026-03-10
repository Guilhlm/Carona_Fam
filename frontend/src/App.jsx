import { useRoutes } from 'react-router-dom';
import routes from './routes';
import Background from './assets/images/Background.png';

function App() {
  const element = useRoutes(routes);
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <img src={Background} alt="" className="w-full h-full object-cover blur-lg" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(125deg, rgba(9,9,10,0.9), rgba(14,14,25,0.9))',
          }}
        />
      </div>
      {element}
    </div>
  );
}

export default App;