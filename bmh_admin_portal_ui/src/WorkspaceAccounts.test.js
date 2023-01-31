import { mount} from 'enzyme';
import WorkspaceAccounts from './views/workspace-accounts';
import * as apiUtils from './util/api';
import { BrowserRouter } from 'react-router-dom';

const tableData = [
    {
        "nih_funded_award_number": "1U2CDA050098-01",
        "request_status": "failed",
        "workspace_type": "STRIDES Credits",
        "total-usage": 0,
        "strides-credits": 250,
        "soft-limit": 130,
        "hard-limit": 225,
        "bmh_workspace_id": "13f9765f-e515-4349-909c-14223418132a",
    },
    {
        "hard-limit": 150,
        "nih_funded_award_number": "1U2CDA350098-01",
        "bmh_workspace_id": "13f9765f-e515-4a49-909c-14223418132a",
        "total-usage": 0,
        "request_status": "success",
        "soft-limit": 100,
        "strides-credits": 250,
        "workspace_type": "STRIDES Credits"
    }
];
const formattedData = {
        "hard-limit": "$225",
        "nih_funded_award_number": "1U2CDA050098-01",
        "bmh_workspace_id": "13f9765f-e515-4349-909c-14223418132a",
        "total-usage": "$0",
        "request_status": "Failed",
        "soft-limit": "$130",
        "strides-credits": "$250",
        "workspace_type": "STRIDES Credits"
    }

const columns = [
    {
        dataField: 'nih_funded_award_number',
        text: 'NIH Award/Grant ID',
        editable: false
    },
    {
        dataField: 'request_status',
        text: 'Request Status',
        editable: false,
    },
    {
        dataField: 'workspace_type',
        text: 'Workspace Type',
        editable: false
    },
    {
        dataField: 'total-usage',
        text: 'Total Usage',
        editable: false,
    },
    {
        dataField: 'strides-credits',
        text: 'Strides Credits',
        editable: false,
    },
    {
        dataField: 'soft-limit',
        text: 'Soft Limit',
        editable: true,
    },
    {
        dataField: 'hard-limit',
        text: 'Hard Limit',
        editable: true,
    },
    {
        dataField: 'access-link',
        text: 'Workspaces Link',
        editable: false,
        isDummyField: true
    }
]
const NUMBER_OF_COLUMNS = 8
process.env.REACT_APP_OIDC_AUTH_URI = "https://fence.planx-pla.net/user/oauth2/authorize"

const mountAccountsWrapper = () =>
    mount(
        <BrowserRouter>
            <WorkspaceAccounts />
        </BrowserRouter>
    );


it('renders WorkspaceAccounts table with no data', () => {
    const workspaceAccountsWrapper = mountAccountsWrapper();
    // console.log(workspaceAccountsWrapper.find('BootstrapTable').debug());
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    expect(table).toHaveLength(1);
    expect(table.find('p').text()).toBe("No active workspaces to view.");
});

it('verifies workspace accounts table has specific number of rows', () => {
    jest.spyOn(apiUtils, 'getWorkspaces').mockImplementation((callback) => { callback(tableData) });
    // jest.spyOn(authUtils, 'authorizeAdmin').mockResolvedValue(true);

    const workspaceAccountsWrapper = mountAccountsWrapper();
    // console.log(workspaceAccountsWrapper.find('BootstrapTable').debug());
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    expect(table).toHaveLength(1);
    // console.log("***************Seperator***************");

    //Verify all the column headers are appearing correctly.
    const headers = table.find('th');
    headers.forEach((header,index) => {
        //Ignore dummy field
        if(columns[index]['isDummyField']) return;

        //Verify text being displayed properly
        expect(header.text().trim()).toBe(columns[index]['text']);

    });

    // verifying number of rows to be displayed is equal to the number of records in the tableData
    const rows = workspaceAccountsWrapper.find('SimpleRow');
    expect(rows).toHaveLength(tableData.length);

    // verifying number of cells in a row are equal NUMBER_OF_COLUMNS
    const firstRowCells = rows.first().find('Cell');
    expect(firstRowCells).toHaveLength(NUMBER_OF_COLUMNS);

    columns.filter((column)=>!column['isDummyField']).forEach((column)=>{

        const cell = firstRowCells.find({"column":column});

        //Verifying the values in each column are displayed correctly with formatting
        expect(cell.text()).toBe(formattedData[column.dataField]);

        //Verifying the editability of each cell according to the defined columns
        expect(cell.prop('editable')).toBe(column['editable']);

    })

    // workspaceAccountsWrapper.unmount();
});
