import WorkspaceAccounts from './views/workspace-accounts';
import { shallow } from 'enzyme';



it('renders WorkspaceAccounts component', () => {

    const workspaceAccountsWrapper = shallow(<WorkspaceAccounts />)

    console.log(workspaceAccountsWrapper.debug());
    workspaceAccountsWrapper.setState({ workspaces: {}});
    expect(
        workspaceAccountsWrapper
            .find('BootstrapTableContainer')
            .find({ "keyField": 'bmh_workspace_id' })
    ).toHaveLength(1);
});
