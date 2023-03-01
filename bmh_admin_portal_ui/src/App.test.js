import App from './App'
import { shallow } from 'enzyme';



it('renders App component', () => {

    const appWrapper = shallow(<App/>)

    expect(appWrapper.find('NavBar')).toHaveLength(1);
    expect(appWrapper.find('LoginCallback')).toHaveLength(1);
    const routeList = ["/login", "/login/callback"]
    routeList.forEach((route) =>
    {
      expect(appWrapper.find('Route').find({"path" :route})).toHaveLength(1);
    });
    expect(appWrapper.find('PrivateRoute')).toHaveLength(3);
    const privateRouteList = ["/admin", "/request-workspace", "/"]
    privateRouteList.forEach((route) =>
    {
      expect(appWrapper.find('PrivateRoute').find({"path" :route})).toHaveLength(1);
    });
});
