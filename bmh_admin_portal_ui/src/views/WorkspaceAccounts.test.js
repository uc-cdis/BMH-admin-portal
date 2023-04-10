import { mount } from 'enzyme';
import { waitFor } from '@testing-library/react';
import WorkspaceAccounts from './workspace-accounts';
import * as apiUtils from '../util/api';
import * as authUtils from '../util/auth';
import { BrowserRouter } from 'react-router-dom';

const tableData = [{
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
const directPayTableData = [{
    "bmh_workspace_id": "13f9765f-e515-4349-909c-21313418132a",
    "request_status": "failed",
    "workspace_type": "Direct Pay",
    "total-usage": 0,
    "direct_pay_limit": 50,
    "soft-limit": 40,
    "hard-limit": 50
},
{
    "bmh_workspace_id": "13f9765f-e515-4a49-909c-14043418132a",
    "request_status": "success",
    "workspace_type": "Direct Pay",
    "total-usage": 0,
    "hard-limit": 50,
    "soft-limit": 40,
    "direct_pay_limit": 50,

}
];
const formattedData = {
    "hard-limit": "$225",
    "nih_funded_award_number": "1U2CDA050098-01",
    "total-usage": "$0",
    "request_status": "Failed",
    "soft-limit": "$130",
    "strides-credits": "$250",
    "workspace_type": "STRIDES Credits"
}

const formattedDirectPayData = {
    "hard-limit": "$50",
    "total-usage": "$0",
    "request_status": "Failed",
    "soft-limit": "$40",
    "strides-credits": "$50",
    "workspace_type": "Direct Pay"
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

const columnsDirectPay = [
    {
        dataField: 'bmh_workspace_id',
        text: 'OCC Request ID',
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
        dataField: 'direct_pay_limit',
        text: 'Compute Purchased',
        editable: false,
    },
    {
        dataField: 'soft-limit',
        text: 'Soft Limit',
        editable: false,
    },
    {
        dataField: 'hard-limit',
        text: 'Hard Limit',
        editable: false,
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

const mountAccountsWrapper = (tableData, isAdmin = false) => {
    jest.spyOn(apiUtils, 'getWorkspaces').mockImplementation((callback) => { callback(tableData) });
    jest.spyOn(authUtils, 'authorizeAdmin').mockResolvedValue(isAdmin);
    return mount(
        <BrowserRouter>
            <WorkspaceAccounts />
        </BrowserRouter>
    );
}

const mountDirectPayAccountWrapper = (directPayTableData, isAdmin = false) => {
    jest.spyOn(apiUtils, 'getWorkspaces').mockImplementation((callback) => { callback(directPayTableData) });
    jest.spyOn(authUtils, 'authorizeAdmin').mockResolvedValue(isAdmin);
    return mount(
        <BrowserRouter>
            <WorkspaceAccounts />
        </BrowserRouter>
    );
}


it('renders WorkspaceAccounts table with no data', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper([]);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    console.log(table);
    await waitFor(() => {
        expect(table).toHaveLength(1);
    });
    expect(table.find('p').text()).toBe("No active workspaces to view.");

    //for OCC Direct Pay Workspace Accounts Table
    const workspaceDirectPayAccountsWrapper = mountDirectPayAccountWrapper([]);
    const directpaytable = workspaceDirectPayAccountsWrapper.find('BootstrapTable');
    await waitFor(() => {
        expect(directpaytable).toHaveLength(1);
    });
    expect(directpaytable.find('p').text()).toBe("No active workspaces to view.");
});


it('renders workspaceAccounts table which has specific number of rows', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    const rows = table.find('SimpleRow');
    await waitFor(() => {
        expect(rows).toHaveLength(tableData.length);
    });

    //for OCC Direct Pay Workspace Accounts Table
    const workspaceDirectPayAccountsWrapper = mountDirectPayAccountWrapper(directPayTableData);
    const directpaytable = workspaceDirectPayAccountsWrapper.find('BootstrapTable');
    const directpayrows = directpaytable.find('SimpleRow');
    await waitFor(() => {
        expect(directpayrows).toHaveLength(directPayTableData.length);
    });
});

it('verifies all the column headers are appearing correctly.', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    const headers = table.find('th');
    await waitFor(() => {
        headers.forEach((header, index) => {
            expect(header.text().trim()).toBe(columns[index]['text']);
        });
    });

    //for OCC Direct Pay Workspace Accounts Table
    const workspaceDirectPayAccountsWrapper = mountDirectPayAccountWrapper(directPayTableData);
    const directpaytable = workspaceDirectPayAccountsWrapper.find('BootstrapTable');
    const directpayheaders = directpaytable.find('th');
    await waitFor(() => {
        directpayheaders.forEach((header, index) => {
            expect(header.text().trim()).toBe(columns[index]['text']);
        });
    });
});

it('verifies number of cells in a row are equal to NUMBER_OF_COLUMNS', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    const rows = table.find('SimpleRow');
    const firstRowCells = rows.first().find('Cell');
    await waitFor(() => {
        expect(firstRowCells).toHaveLength(NUMBER_OF_COLUMNS);
    });

    //for OCC Direct Pay Workspace Accounts Table
    const workspaceDirectPayAccountsWrapper = mountDirectPayAccountWrapper(directPayTableData);
    const directpaytable = workspaceDirectPayAccountsWrapper.find('BootstrapTable');
    const directpayrows = directpaytable.find('SimpleRow');
    const directPayFirstRowCells = directpayrows.first().find('Cell');
    await waitFor(() => {
        expect(directPayFirstRowCells).toHaveLength(NUMBER_OF_COLUMNS);
    });
});

it('verifies the values in each column are displayed correctly with formatting', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    const rows = table.find('SimpleRow');
    const firstRowCells = rows.first().find('Cell');

    await waitFor(() => {
        columns.filter((column) => !column['isDummyField']).forEach((column) => {
            const cell = firstRowCells.find({ "column": column });
            expect(cell.text()).toBe(formattedData[column.dataField]);
        })
    });

    //for OCC Direct Pay Workspace Accounts Table
    const workspaceDirectPayAccountsWrapper = mountDirectPayAccountWrapper(directPayTableData);
    const directpaytable = workspaceDirectPayAccountsWrapper.find('BootstrapTable');
    const directpayrows = directpaytable.find('SimpleRow');
    const directPayFirstRowCells = directpayrows.first().find('Cell');

    await waitFor(() => {
        columns.filter((column) => !column['isDummyField']).forEach((column) => {
            const cell = directPayFirstRowCells.find({ "column": column });
            expect(cell.text()).toBe(formattedDirectPayData[column.dataField]);
        })
    });
});

it('verifies the editability of each cell according to the defined columns', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    const rows = table.find('SimpleRow');
    const firstRowCells = rows.first().find('Cell');

    await waitFor(() => {
        columns.forEach((column) => {
            const cell = firstRowCells.find({ "column": column });
            expect(cell.prop('editable')).toBe(column['editable']);
        })
    });

    //for OCC Direct Pay Workspace Accounts Table, currently we dont have any columns editable
    //but this code is added for future compatibility
    const workspaceDirectPayAccountsWrapper = mountDirectPayAccountWrapper(directPayTableData);
    const directpaytable = workspaceDirectPayAccountsWrapper.find('BootstrapTable');
    const directpayrows = directpaytable.find('SimpleRow');
    const directPayFirstRowCells = directpayrows.first().find('Cell');

    await waitFor(() => {
        columns.forEach((column) => {
            const cell = directPayFirstRowCells.find({ "column": column });
            expect(cell.prop('editable')).toBe(column['editable']);
        })
    });
});

it('verifies the error message when soft-limit is incorrect', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    const rows = table.find('SimpleRow');
    const firstRowCells = rows.first().find('Cell');
    await waitFor(() => {
        columns.filter((eachColumn)=> eachColumn['dataField'] === 'soft-limit').forEach((eachColumn) => {
            const cell = firstRowCells.find({ "column": eachColumn });
            let { row, column } = cell.props();
            let validator = column.validator;
            let test_scenarios = {
                greater_than_hard_limit : {
                    value : row['hard-limit'] + 1,
                    response : {"message": "Soft limit must be less than hard limit.", "valid": false}
                },
                hard_limit : {
                    value : row['hard-limit'],
                    response : {"message": "Soft limit must be less than hard limit.", "valid": false}
                },
                valid_scenario :{
                    value : row['hard-limit'] - 1,
                    response: true
                },
                zero : {
                    value : 0,
                    response : { valid : false, message: 'Soft limit must be greater than 0 (zero).'}
                },
                smaller_than_zero : {
                    value : -1,
                    response : { valid : false, message: 'Soft limit must be greater than 0 (zero).'}
                },
            };
            for (let scenario in test_scenarios) {
                let response = validator(test_scenarios[scenario]['value'], row, column);
                    expect(response).toEqual(test_scenarios[scenario]['response']);
            };
        });
    });
});

it('verifies the error message when hard-limit is incorrect', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    const rows = table.find('SimpleRow');
    const firstRowCells = rows.first().find('Cell');
    await waitFor(() => {
        columns.filter((eachColumn)=> eachColumn['dataField'] === 'hard-limit').forEach((eachColumn) => {
            const cell = firstRowCells.find({ "column": eachColumn });
            let { row, column } = cell.props();
            let validator = column.validator;
            let error_response = { "message": "Hard limit must be greater than soft limit.", "valid": false };

            let success_cases = [row['soft-limit']+1];
            let failure_cases = [row['soft-limit']-1, row['soft-limit'],0,-1];

            for (let value in success_cases) {
                let response = validator(success_cases[value], row, column);
                expect(response).toEqual(true);
            };

            for (let value in failure_cases) {
                let response = validator(failure_cases[value], row, column);
                expect(response).toEqual(error_response);
            };
        });
    });
});

it('verifies the setWorkspaceLimits is called upon save correctly', async () => {
    const mockFunction = jest.spyOn(apiUtils, 'setWorkspaceLimits');
    mockFunction.mockImplementation(()=>{})
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    const rows = table.find('SimpleRow');
    const firstRowCells = rows.first().find('Cell');

    await waitFor(() => {
        columns.filter((eachColumn)=> eachColumn['editable']).forEach((eachColumn) => {
            const cell = firstRowCells.find({ "column": eachColumn });
            let { row, column } = cell.props();
            let new_limits = {};
            let beforeSaveCall = table.prop('cellEdit').options.beforeSaveCell;
            if (column['dataField'] === 'soft-limit') {
                let { oldValue, newValue } = { oldValue: row['soft-limit'], newValue: 150 };
                beforeSaveCall(oldValue, newValue, row, column);
                new_limits = {
                    'hard-limit': row['hard-limit'],
                    'soft-limit': newValue
                }
            } else if(column['dataField'] === 'hard-limit'){
                let { oldValue, newValue } = { oldValue: row['hard-limit'], newValue: 150 };
                beforeSaveCall(oldValue, newValue, row, column);
                new_limits = {
                    'soft-limit': row['soft-limit'],
                    'hard-limit': newValue
                }
            }
            expect(mockFunction).toHaveBeenCalledWith(row['bmh_workspace_id'],new_limits);
        });
    });
});

it('verifies the Request Workspace link is applied correctly', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData, false);
    await waitFor(() => {}); //Need to have this to avoid `act` errors due to async/await calls in adminAuthorized
    workspaceAccountsWrapper.update();
    expect(workspaceAccountsWrapper.find('Link')).toHaveLength(1);
    expect(workspaceAccountsWrapper.find('Link').find({"to":"/request-workspace"}).text()).toBe("Request New Workspace");

    //for OCC Direct Pay Workspace Accounts Table
    const workspaceDirectPayAccountsWrapper = mountDirectPayAccountWrapper(directPayTableData, false);
    await waitFor(() => {}); //Need to have this to avoid `act` errors due to async/await calls in adminAuthorized
    workspaceDirectPayAccountsWrapper.update();
    expect(workspaceDirectPayAccountsWrapper.find('Link')).toHaveLength(1);
    expect(workspaceDirectPayAccountsWrapper.find('Link').find({"to":"/request-workspace"}).text()).toBe("Request New Workspace");
});

it('verifies the Admin link is applied correctly', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData, true);
    await waitFor(() => {}); //Need to have this to avoid `act` errors due to async/await calls in adminAuthorized
    workspaceAccountsWrapper.update();
    expect(workspaceAccountsWrapper.find('Link')).toHaveLength(2); //There are two links in the bottom if the user is admin
    expect(workspaceAccountsWrapper.find('Link').find({"to":"/request-workspace"}).text()).toBe("Request New Workspace");
    expect(workspaceAccountsWrapper.find('Link').find({"to":"/admin"}).text()).toBe("Administrate Workspace");

    //for OCC Direct Pay Workspace Accounts Table
    const workspaceDirectPayAccountsWrapper = mountDirectPayAccountWrapper(directPayTableData, true);
    await waitFor(() => {}); //Need to have this to avoid `act` errors due to async/await calls in adminAuthorized
    workspaceDirectPayAccountsWrapper.update();
    expect(workspaceDirectPayAccountsWrapper.find('Link')).toHaveLength(2); //There are two links in the bottom if the user is admin
    expect(workspaceDirectPayAccountsWrapper.find('Link').find({"to":"/request-workspace"}).text()).toBe("Request New Workspace");
    expect(workspaceDirectPayAccountsWrapper.find('Link').find({"to":"/admin"}).text()).toBe("Administrate Workspace");
});
